import { query } from '@/lib/db_existing'

export type Visibility = 'public' | 'invite-only' | 'hidden'
export type ListingStatus = 'open' | 'closed'
export type SubmissionStatus = 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn'

export const connectDb = {
  async upsertAgency(userId: string | number, payload: {
    name: string
    description?: string
    location?: string
    website?: string
    focus_tags?: any
    union_specialties?: any
    representation_types?: any
    accepting_new_talent?: boolean
  }) {
    const rows = await query(
      `SELECT id FROM agencies WHERE user_id = ? LIMIT 1`,
      [userId]
    ) as Array<{ id: number }>
    if (rows[0]?.id) {
      await query(
        `UPDATE agencies SET name=?, description=?, location=?, website=?, focus_tags=?, union_specialties=?, representation_types=?, accepting_new_talent=? WHERE id=?`,
        [
          payload.name,
          payload.description || null,
          payload.location || null,
          payload.website || null,
          payload.focus_tags ? JSON.stringify(payload.focus_tags) : null,
          payload.union_specialties ? JSON.stringify(payload.union_specialties) : null,
          payload.representation_types ? JSON.stringify(payload.representation_types) : null,
          payload.accepting_new_talent ? 1 : 0,
          rows[0].id,
        ]
      )
      return rows[0].id
    }
    const result = await query(
      `INSERT INTO agencies (user_id, name, description, location, website, focus_tags, union_specialties, representation_types, accepting_new_talent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        payload.name,
        payload.description || null,
        payload.location || null,
        payload.website || null,
        payload.focus_tags ? JSON.stringify(payload.focus_tags) : null,
        payload.union_specialties ? JSON.stringify(payload.union_specialties) : null,
        payload.representation_types ? JSON.stringify(payload.representation_types) : null,
        payload.accepting_new_talent ? 1 : 0,
      ]
    ) as any
    return Number(result.insertId)
  },

  async getListings(filters: {
    q?: string
    tags?: string[]
    location?: string
    union?: string
    status?: ListingStatus
    limit?: number
    offset?: number
  }) {
    const where: string[] = ['rl.status = ?']
    const params: any[] = [filters.status || 'open']
    if (filters.q) {
      where.push('(rl.title LIKE ? OR rl.description LIKE ? OR a.name LIKE ?)')
      const like = `%${filters.q}%`
      params.push(like, like, like)
    }
    if (filters.location) {
      where.push('a.location LIKE ?')
      params.push(`%${filters.location}%`)
    }
    // Basic tag/union filter using JSON_SEARCH when available
    if (filters.union) {
      where.push("JSON_SEARCH(a.union_specialties, 'one', ?) IS NOT NULL")
      params.push(filters.union)
    }
    if (filters.tags && filters.tags.length > 0) {
      for (const t of filters.tags.slice(0, 5)) {
        where.push("JSON_SEARCH(a.focus_tags, 'one', ?) IS NOT NULL")
        params.push(t)
      }
    }
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)))
    const offset = Math.max(0, Number(filters.offset || 0))
    // Note: Some MySQL versions reject bound placeholders for LIMIT/OFFSET.
    // Safely inline validated numeric values to avoid ER_WRONG_ARGUMENTS.
    const sql = `SELECT rl.id, rl.title, rl.description, rl.criteria, rl.status,
              a.id as agency_id, a.name as agency_name, a.location as agency_location,
              a.website as agency_website, a.focus_tags, a.accepting_new_talent, a.is_verified
       FROM representation_listings rl
       INNER JOIN agencies a ON a.id = rl.agency_id
       WHERE ${where.join(' AND ')}
       ORDER BY rl.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    const rows = await query(sql, params) as any[]
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      criteria: safeJson(r.criteria),
      status: r.status as ListingStatus,
      agency: {
        id: r.agency_id,
        name: r.agency_name,
        location: r.agency_location,
        website: r.agency_website,
        focus_tags: safeJson(r.focus_tags) || [],
        is_verified: !!r.is_verified,
        accepting_new_talent: !!r.accepting_new_talent,
      },
    }))
  },

  async createListing(agencyId: number, payload: {
    title: string
    description?: string
    criteria?: any
  }) {
    const res = await query(
      `INSERT INTO representation_listings (agency_id, title, description, criteria, status)
       VALUES (?, ?, ?, ?, 'open')`,
      [agencyId, payload.title, payload.description || null, payload.criteria ? JSON.stringify(payload.criteria) : null]
    ) as any
    return Number(res.insertId)
  },

  async getAgencyIdByUser(userId: string | number) {
    const rows = await query(`SELECT id FROM agencies WHERE user_id = ? LIMIT 1`, [userId]) as Array<{ id: number }>
    return rows[0]?.id || null
  },

  async getListingById(id: string | number) {
    const rows = await query(
      `SELECT rl.*, a.name as agency_name FROM representation_listings rl INNER JOIN agencies a ON a.id = rl.agency_id WHERE rl.id = ? LIMIT 1`,
      [id]
    ) as any[]
    return rows[0] || null
  },

  async updateListingStatus(id: number, status: ListingStatus) {
    await query(`UPDATE representation_listings SET status=? WHERE id=?`, [status, id])
  },

  async createSubmission(actorId: string | number, payload: {
    target_type: 'agency' | 'listing'
    target_id: number
    cover_letter?: string
    links?: any
    score?: number
  }) {
    const res = await query(
      `INSERT INTO connect_submissions (actor_id, target_type, target_id, cover_letter, links, status, score)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [
        actorId,
        payload.target_type,
        payload.target_id,
        payload.cover_letter || null,
        payload.links ? JSON.stringify(payload.links) : null,
        payload.score || null,
      ]
    ) as any
    return Number(res.insertId)
  },

  async listSubmissionsForActor(actorId: string | number, status?: SubmissionStatus) {
    const where = ['cs.actor_id = ?']
    const params: any[] = [actorId]
    if (status) {
      where.push('cs.status = ?')
      params.push(status)
    }
    const rows = await query(
      `SELECT cs.*, a.name as agency_name, rl.title as listing_title
       FROM connect_submissions cs
       LEFT JOIN representation_listings rl ON (cs.target_type='listing' AND rl.id = cs.target_id)
       LEFT JOIN agencies a ON (
         (cs.target_type='agency' AND a.id = cs.target_id) OR (cs.target_type='listing' AND a.id = rl.agency_id)
       )
       WHERE ${where.join(' AND ')}
       ORDER BY cs.created_at DESC
       LIMIT 200`,
      params
    ) as any[]
    return rows
  },

  async listInboxForAgent(userId: string | number, status?: SubmissionStatus) {
    // submissions where target agency belongs to this user
    const where: string[] = ['a.user_id = ?']
    const params: any[] = [userId]
    if (status) {
      where.push('cs.status = ?')
      params.push(status)
    }
    const rows = await query(
      `SELECT cs.*, u.name as actor_name, u.email as actor_email, rl.title as listing_title, a.name as agency_name
       FROM connect_submissions cs
       INNER JOIN agencies a ON (
         (cs.target_type='agency' AND a.id = cs.target_id) OR
         (cs.target_type='listing' AND a.id = (SELECT agency_id FROM representation_listings WHERE id = cs.target_id))
       )
       INNER JOIN users u ON u.id = cs.actor_id
       LEFT JOIN representation_listings rl ON rl.id = cs.target_id AND cs.target_type='listing'
       WHERE ${where.join(' AND ')}
       ORDER BY cs.created_at DESC
       LIMIT 200`,
      params
    ) as any[]
    return rows
  },

  async updateSubmissionStatus(id: number, status: SubmissionStatus) {
    await query(`UPDATE connect_submissions SET status=? WHERE id=?`, [status, id])
  },

  async upsertActorPrefs(actorId: string | number, prefs: { visibility?: Visibility; allow_contact?: boolean; metadata?: any }) {
    const exists = await query(`SELECT actor_id FROM connect_actor_prefs WHERE actor_id = ?`, [actorId]) as any[]
    if (exists[0]) {
      await query(
        `UPDATE connect_actor_prefs SET visibility = COALESCE(?, visibility), allow_contact = COALESCE(?, allow_contact), metadata = COALESCE(?, metadata) WHERE actor_id = ?`,
        [prefs.visibility || null, typeof prefs.allow_contact === 'boolean' ? (prefs.allow_contact ? 1 : 0) : null, prefs.metadata ? JSON.stringify(prefs.metadata) : null, actorId]
      )
    } else {
      await query(
        `INSERT INTO connect_actor_prefs (actor_id, visibility, allow_contact, metadata) VALUES (?, ?, ?, ?)`,
        [actorId, prefs.visibility || 'public', prefs.allow_contact ? 1 : 0, prefs.metadata ? JSON.stringify(prefs.metadata) : null]
      )
    }
  },
}

function safeJson(value: any): any {
  if (!value) return null
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return null }
  }
  if (typeof value === 'object') return value
  return null
}
