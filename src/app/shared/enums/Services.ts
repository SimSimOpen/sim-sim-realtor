/** Mirrors net.jemsit.common.data.enums.services.ServiceCategory on the backend. */
export enum ServiceCategory {
  REPAIRS_CONSTRUCTION = 'REPAIRS_CONSTRUCTION',
  CLEANING = 'CLEANING',
  TUTORING = 'TUTORING',
  MOVING_DELIVERY = 'MOVING_DELIVERY',
  BEAUTY_HEALTH = 'BEAUTY_HEALTH',
  IT_DIGITAL = 'IT_DIGITAL',
  AUTO = 'AUTO',
  EVENTS_CATERING = 'EVENTS_CATERING',
  HOUSEHOLD = 'HOUSEHOLD',
  OTHER = 'OTHER',
}

/**
 * Which side of the two-sided market the poster is on: OFFERING supplies the service,
 * SEEKING needs one. Mirrors net.jemsit.common.data.enums.services.ServiceKind.
 */
export enum ServiceKind {
  OFFERING = 'OFFERING',
  SEEKING = 'SEEKING',
}

/** How the price is meant; NEGOTIABLE (or no price at all) reads as "Negotiable". */
export enum PriceMode {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  NEGOTIABLE = 'NEGOTIABLE',
}
