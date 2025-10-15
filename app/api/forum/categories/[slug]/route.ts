import { NextRequest, NextResponse } from 'next/server'
import { forumCategories, canAccessCategory, ForumAccessLevel } from '@/lib/forum'
import { resolveForumUser } from '@/lib/forum-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const user = await resolveForumUser(request)
    const category = await forumCategories.getBySlug(slug)

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (!canAccessCategory(user, category.access_level)) {
      return NextResponse.json(
        { error: 'You do not have permission to view this category' },
        { status: 403 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Failed to load forum category:', error)
    return NextResponse.json(
      { error: 'Failed to load forum category' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const user = await resolveForumUser(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can update forum categories' },
        { status: 403 }
      )
    }

    const category = await forumCategories.getBySlug(slug)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates: Partial<{
      name: string
      description: string | null
      access_level: ForumAccessLevel
      sort_order: number
      is_active: boolean
      slug: string
    }> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.access_level !== undefined) updates.access_level = body.access_level
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.slug !== undefined) updates.slug = body.slug

    if (updates.slug && updates.slug !== category.slug) {
      const existingSlug = await forumCategories.getBySlug(updates.slug)
      if (existingSlug) {
        return NextResponse.json(
          { error: 'A category already exists with that slug' },
          { status: 409 }
        )
      }
    }

    if (
      updates.access_level &&
      !['public', 'actor', 'professional', 'vip'].includes(updates.access_level)
    ) {
      return NextResponse.json(
        { error: 'Invalid access level provided' },
        { status: 400 }
      )
    }

    const updated = await forumCategories.update(category.id, updates)
    return NextResponse.json({ category: updated })
  } catch (error) {
    console.error('Failed to update forum category:', error)
    return NextResponse.json(
      { error: 'Failed to update forum category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const user = await resolveForumUser(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can manage forum categories' },
        { status: 403 }
      )
    }

    const category = await forumCategories.getBySlug(slug)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await forumCategories.update(category.id, { is_active: false })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete forum category:', error)
    return NextResponse.json(
      { error: 'Failed to delete forum category' },
      { status: 500 }
    )
  }
}
