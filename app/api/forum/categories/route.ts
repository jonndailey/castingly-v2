import { NextRequest, NextResponse } from 'next/server'
import { forumCategories, ForumAccessLevel } from '@/lib/forum'
import { resolveForumUser } from '@/lib/forum-auth'

function slugifyLabel(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveForumUser(request)
    const categories = await forumCategories.list(user)

    return NextResponse.json({
      categories,
      access: user ? user.role : 'guest'
    })
  } catch (error) {
    console.error('Failed to fetch forum categories:', error)
    return NextResponse.json(
      { error: 'Failed to load forum categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveForumUser(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can manage forum categories' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, access_level, sort_order, slug } = body as {
      name?: string
      description?: string
      access_level?: ForumAccessLevel
      sort_order?: number
      slug?: string
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const normalizedAccessLevel: ForumAccessLevel = access_level || 'public'

    if (!['public', 'actor', 'professional', 'vip'].includes(normalizedAccessLevel)) {
      return NextResponse.json(
        { error: 'Invalid access level provided' },
        { status: 400 }
      )
    }

    const categorySlug = slug || slugifyLabel(name)

    const existingBySlug = await forumCategories.getBySlug(categorySlug)
    if (existingBySlug) {
      return NextResponse.json(
        { error: 'Category slug already exists' },
        { status: 409 }
      )
    }

    const category = await forumCategories.create({
      name,
      slug: categorySlug,
      description,
      access_level: normalizedAccessLevel,
      sort_order
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Failed to create forum category:', error)
    return NextResponse.json(
      { error: 'Failed to create forum category' },
      { status: 500 }
    )
  }
}
