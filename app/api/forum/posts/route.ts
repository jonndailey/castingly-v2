import { NextRequest, NextResponse } from 'next/server'
import { forumCategories, forumPosts, getAccessibleLevelsForUser, canAccessCategory } from '@/lib/forum'
import { resolveForumUser } from '@/lib/forum-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await resolveForumUser(request)
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q') || searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const categorySlug = searchParams.get('categorySlug')

    if (searchTerm) {
      const levels = getAccessibleLevelsForUser(user)
      const results = await forumPosts.search(searchTerm, levels)
      return NextResponse.json({ posts: results, search: searchTerm })
    }

    if (!categoryId && !categorySlug) {
      return NextResponse.json(
        { error: 'categoryId or categorySlug is required' },
        { status: 400 }
      )
    }

    const category = categoryId
      ? await forumCategories.getById(categoryId)
      : await forumCategories.getBySlug(categorySlug as string)

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (!canAccessCategory(user, category.access_level)) {
      return NextResponse.json(
        { error: 'You do not have permission to view this forum category' },
        { status: 403 }
      )
    }

    const posts = await forumPosts.listByCategory(category.id)
    return NextResponse.json({ posts, category })
  } catch (error) {
    console.error('Failed to load forum posts:', error)
    return NextResponse.json(
      { error: 'Failed to load forum posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveForumUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication is required to create posts' },
        { status: 401 }
      )
    }

    const payload = await request.json()
    const { categoryId, categorySlug, title, content } = payload as {
      categoryId?: string
      categorySlug?: string
      title?: string
      content?: string
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be 255 characters or less' },
        { status: 400 }
      )
    }

    const category = categoryId
      ? await forumCategories.getById(categoryId)
      : categorySlug
      ? await forumCategories.getBySlug(categorySlug)
      : null

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (!canAccessCategory(user, category.access_level)) {
      return NextResponse.json(
        { error: 'You do not have permission to post in this category' },
        { status: 403 }
      )
    }

    const post = await forumPosts.create({
      category_id: category.id,
      user_id: user.id,
      title: title.trim(),
      content
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Failed to create forum post:', error)
    return NextResponse.json(
      { error: 'Failed to create forum post' },
      { status: 500 }
    )
  }
}
