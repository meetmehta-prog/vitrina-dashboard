import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { allowedUsers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Helper function to check if user is admin
async function isAdmin() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return false;
  }

  const user = await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.email, session.user.email.toLowerCase()))
    .limit(1);

  return user.length > 0 && user[0].isAdmin;
}

// GET - List all allowed users
export async function GET() {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await db.select().from(allowedUsers);

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new allowed user
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, name } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(allowedUsers)
      .where(eq(allowedUsers.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Add new user
    const newUser = await db
      .insert(allowedUsers)
      .values({
        email: email.toLowerCase(),
        name: name || null,
        isActive: true,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json({
      message: 'User added successfully',
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        isActive: newUser[0].isActive,
        createdAt: newUser[0].createdAt
      }
    });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user status (activate/deactivate)
export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, isActive, name } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (name !== undefined) {
      updateData.name = name;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await db
      .update(allowedUsers)
      .set(updateData)
      .where(eq(allowedUsers.email, email.toLowerCase()))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        isActive: updatedUser[0].isActive
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove user
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const deletedUser = await db
      .delete(allowedUsers)
      .where(eq(allowedUsers.email, email.toLowerCase()))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User removed successfully',
      email: deletedUser[0].email
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}