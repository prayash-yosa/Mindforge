export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
}

export enum TestMode {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum TestStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

export enum QuestionType {
  MCQ = 'mcq',
  FILL_IN_BLANK = 'fill_in_blank',
  TRUE_FALSE = 'true_false',
  VERY_SHORT = 'very_short',
  SHORT = 'short',
  LONG = 'long',
  NUMERICAL = 'numerical',
}

export enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  AUTO_SUBMITTED = 'auto_submitted',
  EVALUATED = 'evaluated',
}

export enum DocumentProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export enum NotificationCategory {
  ABSENCE_ALERT = 'absence_alert',
  MISSED_TEST = 'missed_test',
  AUTO_SUBMITTED = 'auto_submitted',
  EVALUATION_PENDING = 'evaluation_pending',
  GENERAL = 'general',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
