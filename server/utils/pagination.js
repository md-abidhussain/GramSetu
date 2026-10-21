// Lists are capped so one request cannot pull a whole collection. The body
// stays a plain array (the client already expects one); totals travel in headers.
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export const readPagination = (query = {}) => {
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const requested = Math.floor(Number(query.limit)) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(requested, 1), MAX_PAGE_SIZE);
  return { page, limit, skip: (page - 1) * limit };
};

export const setPaginationHeaders = (res, { page, limit }, total) => {
  res.setHeader('X-Total-Count', String(total));
  res.setHeader('X-Page', String(page));
  res.setHeader('X-Page-Size', String(limit));
};
