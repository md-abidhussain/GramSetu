import mongoose from 'mongoose';

// MongoDB transactions need a replica set (Atlas always is one). A plain local
// mongod is not, so there the work runs without a transaction; the conditional
// status updates in the controllers still stop double-processing.
const TRANSACTIONS_UNSUPPORTED = /Transaction numbers are only allowed|replica set|IllegalOperation/i;

export const withTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (error?.code === 20 || TRANSACTIONS_UNSUPPORTED.test(error?.message || '')) {
      return work(undefined);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
