// Limits of a customer review, the same in the form and on the server.

export const REVIEW_LIMITS = {
  nameMin: 2,
  nameMax: 60,
  cityMax: 60,
  textMin: 10,
  textMax: 2000,
  photosMax: 5,
  /** One photo after reduction in the browser; the server refuses larger ones. */
  photoBytesMax: 3 * 1024 * 1024,
  /** Longest side of a photo after reduction, px. */
  photoSidePx: 1600,
  /** Key of the subject «the order as a whole». */
  orderKey: "order",
} as const;

