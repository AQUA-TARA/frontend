import { reactive } from 'vue'

/**
 * Temporary development-only UI state for Batch 1 testing.
 * NOT a persistent store, NOT an API client, NOT a business state manager.
 * Holds transient photo & location data between CameraView, PortalLaporan, and SuccessTicket.
 */
export const devReportState = reactive({
  photoDataUrl: null,
  latitude: null,
  longitude: null,
  description: '',
  report_type: '',
  ticketId: '',
  riskScore: null,
  submittedAt: null,
  // Canonical ticket status per DEC-002:
  // SUBMITTED -> IN_REVIEW -> CONFIRMED -> IN_PROGRESS -> CLOSED
  status: 'SUBMITTED',

  reset() {
    this.photoDataUrl = null
    this.latitude = null
    this.longitude = null
    this.description = ''
    this.report_type = ''
    this.submittedAt = null
    this.riskScore = null
    this.status = 'SUBMITTED'
    this.ticketId = ''
  }
})
