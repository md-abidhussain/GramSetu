import Tender from '../models/Tender.js';
import Contractor from '../models/Contractor.js';
import { extractTextFromPdf } from '../utils/pdfExtractor.js';
import { storeFile, removeStoredFile } from '../services/cloudinaryService.js';
import { analyzeTenderText } from '../services/ai/assessments.js';
import { isValidId, toText } from '../utils/validators.js';
import { readPagination, setPaginationHeaders } from '../utils/pagination.js';

const optionalDate = (value) => {
  if (value === undefined || value === null || value === '') return { ok: true, date: undefined };
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? { ok: false } : { ok: true, date };
};

export const createTender = async (req, res, next) => {
  let stored = null;
  try {
    const { title, contractorId } = req.body;
    const tenderTitle = toText(title, 300);
    if (!tenderTitle) return res.status(400).json({ message: 'Give the tender a title of 300 characters or fewer.' });
    if (!isValidId(contractorId)) return res.status(400).json({ message: 'Choose the contractor for this tender.' });

    const start = optionalDate(req.body.timelineStart);
    const end = optionalDate(req.body.timelineEnd);
    if (!start.ok || !end.ok) return res.status(400).json({ message: 'Timeline dates are not valid dates.' });
    if (start.date && end.date && end.date < start.date) {
      return res.status(400).json({ message: 'The timeline cannot end before it starts.' });
    }
    if (!req.file) return res.status(400).json({ message: 'Attach the tender PDF.' });

    if (!(await Contractor.exists({ _id: contractorId }))) {
      return res.status(404).json({ message: 'Contractor not found.' });
    }

    const { text } = await extractTextFromPdf(req.file.buffer);
    const analysis = await analyzeTenderText(text);
    stored = await storeFile(req.file, 'tenders');

    const tender = await Tender.create({
      title: tenderTitle,
      contractor: contractorId,
      fileUrl: stored.url,
      filePublicId: stored.publicId,
      extractedText: text.slice(0, 20_000),
      timelineStart: start.date,
      timelineEnd: end.date,
      aiAssessment: { status: analysis.status, reason: analysis.reason, model: analysis.model, assessedAt: analysis.assessedAt },
      // AI fields only when the analysis really ran; otherwise they stay empty.
      ...(analysis.status === 'completed'
        ? {
            aiSummary: analysis.summary,
            budgetAllocated: analysis.budgetAllocated,
            budgetAnalysis: analysis.budgetAnalysis,
            timelineAnalysis: analysis.timelineAnalysis,
            riskScore: analysis.riskScore,
            riskLevel: analysis.riskLevel,
            recommendation: analysis.recommendation
          }
        : {})
    });
    stored = null;

    res.status(201).json(await Tender.findById(tender._id).populate('contractor', 'name registrationId'));
  } catch (error) {
    if (stored) await removeStoredFile(stored);
    next(error);
  }
};

export const getTenders = async (req, res, next) => {
  try {
    const pagination = readPagination(req.query);
    const [tenders, total] = await Promise.all([
      Tender.find().populate('contractor', 'name registrationId').sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
      Tender.estimatedDocumentCount()
    ]);
    setPaginationHeaders(res, pagination, total);
    res.json(tenders);
  } catch (error) {
    next(error);
  }
};

export const getTenderById = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id).populate('contractor', 'name registrationId contactPerson');
    if (!tender) return res.status(404).json({ message: 'Tender not found.' });
    res.json(tender);
  } catch (error) {
    next(error);
  }
};

export const getTendersByContractor = async (req, res, next) => {
  try {
    const tenders = await Tender.find({ contractor: req.params.contractorId })
      .populate('contractor', 'name registrationId')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(tenders);
  } catch (error) {
    next(error);
  }
};
