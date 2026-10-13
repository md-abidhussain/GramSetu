import Tender from '../models/Tender.js';
import Contractor from '../models/Contractor.js';
import { extractTextFromPdf } from '../utils/pdfExtractor.js';
import { uploadBuffer } from '../services/cloudinaryService.js';
import { analyzeTender } from '../services/geminiTenderService.js';
import { isValidId, toText } from '../utils/validators.js';

export const createTender = async (req, res, next) => {
  try {
    const { title, contractorId, timelineStart, timelineEnd } = req.body;

    if (!title || !contractorId) {
      return res.status(400).json({ message: 'Title and contractor ID are required' });
    }

    const tenderTitle = toText(title, 300);
    if (!tenderTitle) {
      return res.status(400).json({ message: 'Give the tender a title of 300 characters or fewer' });
    }

    if (!isValidId(contractorId)) {
      return res.status(400).json({ message: 'That contractor does not exist' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Tender PDF document file is required' });
    }

    // Verify contractor exists
    const contractor = await Contractor.findById(contractorId);
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    // 1. Extract PDF text
    const extractedText = await extractTextFromPdf(req.file.buffer);

    // 2. Upload file to Cloudinary
    const uploadResult = await uploadBuffer(req.file.buffer, 'tenders');

    // 3. Call Gemini Tender Intelligence Analysis
    const aiAnalysis = await analyzeTender(extractedText);

    // 4. Save to Database
    const tender = await Tender.create({
      title: tenderTitle,
      contractor: contractorId,
      fileUrl: uploadResult.secure_url,
      extractedText: extractedText.slice(0, 10000), // Save subset or full
      aiSummary: aiAnalysis.summary,
      budgetAllocated: aiAnalysis.budgetAllocated,
      budgetAnalysis: aiAnalysis.budgetAnalysis,
      timelineStart: timelineStart ? new Date(timelineStart) : undefined,
      timelineEnd: timelineEnd ? new Date(timelineEnd) : undefined,
      timelineAnalysis: aiAnalysis.timelineAnalysis,
      riskScore: aiAnalysis.riskScore,
      riskLevel: aiAnalysis.riskLevel,
      recommendation: aiAnalysis.recommendation
    });

    // Populate contractor data for response
    const populatedTender = await tender.populate('contractor');

    res.status(201).json(populatedTender);
  } catch (error) {
    next(error);
  }
};

export const getTenders = async (req, res, next) => {
  try {
    const tenders = await Tender.find().populate('contractor').sort({ createdAt: -1 });
    res.json(tenders);
  } catch (error) {
    next(error);
  }
};

export const getTenderById = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id).populate('contractor');
    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }
    res.json(tender);
  } catch (error) {
    next(error);
  }
};

export const getTendersByContractor = async (req, res, next) => {
  try {
    const tenders = await Tender.find({ contractor: req.params.contractorId }).populate('contractor');
    res.json(tenders);
  } catch (error) {
    next(error);
  }
};
