export interface Interview {
  id: string
  scheduledAt: string
  duration: number
  type: 'phone' | 'video' | 'in_person' | 'panel' | 'technical' | 'take_home'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  title: string
  candidateFirstName?: string
  candidateLastName?: string
}
