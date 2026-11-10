
const buildSortQuery = (
  req,
  allowedSortFields = [],
  defaultSort = 'createdAt',
) => {
  const hasAllowedFields =
    Array.isArray(allowedSortFields) &&
    allowedSortFields.length > 0

  let sortBy =
    typeof req.query.sortBy === 'string'
      ? req.query.sortBy.trim()
      : defaultSort

  // Validate sort field

  if (
    hasAllowedFields &&
    !allowedSortFields.includes(sortBy)
  ) {
    sortBy = defaultSort
  }

  // Validate order

  const order =
    typeof req.query.order === 'string'
      ? req.query.order.toLowerCase()
      : 'desc'

  const direction =
    order === 'asc' ? 1 : -1

  return {
    [sortBy]: direction,
  }
}

export default buildSortQuery