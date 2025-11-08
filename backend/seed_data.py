"""
Seed script to populate Supabase with demo users, conversations, messages, and events
Run this once to set up demo data for the hackathon
"""

from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta

load_dotenv()

# Initialize Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

print("🌱 Starting database seeding...")

# Demo users to create
demo_users = [
    {
        "email": "alice@office.io",
        "password": "password123",
        "username": "alice",
        "full_name": "Alice Johnson",
        "bio": "Frontend Developer | React enthusiast"
    },
    {
        "email": "bob@office.io",
        "password": "password123",
        "username": "bob",
        "full_name": "Bob Smith",
        "bio": "Backend Engineer | Python & Flask"
    },
    {
        "email": "charlie@office.io",
        "password": "password123",
        "username": "charlie",
        "full_name": "Charlie Davis",
        "bio": "Product Manager | Agile advocate"
    },
    {
        "email": "diana@office.io",
        "password": "password123",
        "username": "diana",
        "full_name": "Diana Martinez",
        "bio": "UX Designer | Figma power user"
    },
    {
        "email": "eve@office.io",
        "password": "password123",
        "username": "eve",
        "full_name": "Eve Chen",
        "bio": "DevOps Engineer | CI/CD expert"
    }
]

# Step 1: Create users
print("\n👥 Creating demo users...")
created_users = []

for user_data in demo_users:
    try:
        # Sign up each user
        response = supabase.auth.admin.create_user({
            "email": user_data["email"],
            "password": user_data["password"],
            "email_confirm": True,  # Auto-confirm email
            "user_metadata": {
                "username": user_data["username"],
                "full_name": user_data["full_name"]
            }
        })

        user_id = response.user.id
        created_users.append({
            "id": user_id,
            "email": user_data["email"],
            "username": user_data["username"],
            "full_name": user_data["full_name"]
        })

        # Update the users table with bio
        supabase.table('users').update({
            "bio": user_data["bio"]
        }).eq('id', user_id).execute()

        print(f"  ✓ Created: {user_data['full_name']} ({user_data['email']})")

    except Exception as e:
        print(f"  ⚠ User {user_data['email']} might already exist: {str(e)}")
        # Try to fetch existing user
        try:
            existing = supabase.table('users').select('*').eq('username', user_data['username']).execute()
            if existing.data:
                created_users.append(existing.data[0])
                print(f"  ✓ Using existing user: {user_data['full_name']}")
        except:
            pass

if len(created_users) < 2:
    print("\n❌ Not enough users created. Please check Supabase connection.")
    exit(1)

print(f"\n✓ {len(created_users)} users ready")

# Step 2: Create conversations
print("\n💬 Creating conversations...")

conversations_data = [
    {
        "type": "direct",
        "name": f"{created_users[0]['full_name']} & {created_users[1]['full_name']}",
        "description": "Direct message",
        "participants": [created_users[0]['id'], created_users[1]['id']]
    },
    {
        "type": "direct",
        "name": f"{created_users[0]['full_name']} & {created_users[2]['full_name']}",
        "description": "Direct message",
        "participants": [created_users[0]['id'], created_users[2]['id']]
    },
    {
        "type": "team",
        "name": "Engineering Team",
        "description": "Main engineering team chat",
        "participants": [u['id'] for u in created_users[:4]]
    },
    {
        "type": "team",
        "name": "Product Squad",
        "description": "Product development discussions",
        "participants": [u['id'] for u in created_users[1:4]]
    },
    {
        "type": "community",
        "name": "React Developers",
        "description": "Frontend React community",
        "participants": [u['id'] for u in created_users]
    },
    {
        "type": "community",
        "name": "Office Watercooler",
        "description": "Random chat and fun",
        "participants": [u['id'] for u in created_users]
    }
]

created_conversations = []

for conv_data in conversations_data:
    try:
        # Create conversation
        conv = supabase.table('conversations').insert({
            "type": conv_data["type"],
            "name": conv_data["name"],
            "description": conv_data["description"],
            "created_by": conv_data["participants"][0]
        }).execute()

        conv_id = conv.data[0]['id']

        # Add participants
        participants = [
            {"conversation_id": conv_id, "user_id": uid}
            for uid in conv_data["participants"]
        ]
        supabase.table('conversation_participants').insert(participants).execute()

        created_conversations.append(conv.data[0])
        print(f"  ✓ Created: {conv_data['name']} ({conv_data['type']})")

    except Exception as e:
        print(f"  ✗ Error creating conversation: {str(e)}")

print(f"\n✓ {len(created_conversations)} conversations created")

# Step 3: Create sample messages
print("\n📝 Creating sample messages...")

if len(created_conversations) >= 3:
    messages_data = [
        # Engineering Team messages
        {
            "conversation_id": created_conversations[2]['id'],
            "sender_id": created_users[0]['id'],
            "content": "Hey team! Ready for the sprint planning meeting?"
        },
        {
            "conversation_id": created_conversations[2]['id'],
            "sender_id": created_users[1]['id'],
            "content": "Yes! I've prepared the backend tasks list."
        },
        {
            "conversation_id": created_conversations[2]['id'],
            "sender_id": created_users[2]['id'],
            "content": "Great! Let's prioritize the auth system refactor."
        },
        # Direct message
        {
            "conversation_id": created_conversations[0]['id'],
            "sender_id": created_users[0]['id'],
            "content": "Can you review my PR when you get a chance?"
        },
        {
            "conversation_id": created_conversations[0]['id'],
            "sender_id": created_users[1]['id'],
            "content": "Sure thing! I'll check it out this afternoon."
        },
        # Community messages
        {
            "conversation_id": created_conversations[4]['id'],
            "sender_id": created_users[0]['id'],
            "content": "Anyone tried the new React 19 features yet?"
        },
        {
            "conversation_id": created_conversations[4]['id'],
            "sender_id": created_users[3]['id'],
            "content": "Yes! The new use hook is amazing for async operations."
        },
    ]

    for msg_data in messages_data:
        try:
            supabase.table('messages').insert(msg_data).execute()
            print("  ✓ Message added")
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")

print("\n✓ Sample messages created")

# Step 4: Create sample events
print("\n📅 Creating sample events...")

now = datetime.now()
events_data = [
    {
        "title": "Team Stand-up",
        "description": "Daily team sync",
        "start_time": (now + timedelta(days=1, hours=9)).isoformat(),
        "end_time": (now + timedelta(days=1, hours=9, minutes=15)).isoformat(),
        "location": "Office.io - Main Room",
        "created_by": created_users[0]['id']
    },
    {
        "title": "Sprint Planning",
        "description": "Plan next sprint tasks",
        "start_time": (now + timedelta(days=2, hours=14)).isoformat(),
        "end_time": (now + timedelta(days=2, hours=16)).isoformat(),
        "location": "Office.io - Conference Room",
        "created_by": created_users[2]['id']
    },
    {
        "title": "Design Review",
        "description": "Review new UI mockups",
        "start_time": (now + timedelta(days=3, hours=10)).isoformat(),
        "end_time": (now + timedelta(days=3, hours=11)).isoformat(),
        "location": "Office.io - Design Studio",
        "created_by": created_users[3]['id']
    },
    {
        "title": "1-on-1 with Manager",
        "description": "Weekly sync",
        "start_time": (now + timedelta(days=4, hours=15)).isoformat(),
        "end_time": (now + timedelta(days=4, hours=15, minutes=30)).isoformat(),
        "location": "Virtual",
        "created_by": created_users[0]['id']
    },
]

for event_data in events_data:
    try:
        event = supabase.table('events').insert(event_data).execute()

        # Add some attendees
        attendees = [
            {"event_id": event.data[0]['id'], "user_id": created_users[i]['id'], "status": "accepted"}
            for i in range(min(3, len(created_users)))
        ]
        supabase.table('event_attendees').insert(attendees).execute()

        print(f"  ✓ Created: {event_data['title']}")
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")

print("\n✓ Sample events created")

# Print summary
print("\n" + "="*50)
print("🎉 DATABASE SEEDED SUCCESSFULLY!")
print("="*50)
print("\n📋 Demo Accounts (password: password123):")
for user in created_users:
    print(f"  • {user['email']} - {user['full_name']}")
print("\n✅ You can now log in with any of these accounts!")
print("="*50 + "\n")
