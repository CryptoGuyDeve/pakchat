# Simple Chat App  

## Overview  
This is a **basic chat application** that allows users to **sign up, search for other users, and send text messages** in real time. It features a clean UI for an easy chatting experience.  

## Tech Stack
- Frontend: React Native with TypeScript, Expo, and Expo Router
- Backend/Database: Supabase
- UI Framework: React Native Paper
- AI Processing: DeepSeek

## Database Schema

### Tables

#### 1. profiles
- `id` (uuid, primary key) - References auth.users.id
- `email` (text, unique)
- `username` (text, unique)
- `full_name` (text)
- `avatar_url` (text, nullable)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

#### 2. conversations
- `id` (uuid, primary key)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

#### 3. conversation_participants
- `conversation_id` (uuid, foreign key to conversations.id)
- `profile_id` (uuid, foreign key to profiles.id)
- `joined_at` (timestamp with time zone)
- Primary Key: (conversation_id, profile_id)

#### 4. messages
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key to conversations.id)
- `sender_id` (uuid, foreign key to profiles.id)
- `content` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

#### 5. message_status
- `message_id` (uuid, foreign key to messages.id)
- `profile_id` (uuid, foreign key to profiles.id)
- `read_at` (timestamp with time zone, nullable)
- Primary Key: (message_id, profile_id)

## Folder Structure

## App Flow  

### 1. **Welcome Screen**  
- Displays the **app logo and tagline**.  
- Offers **Sign Up** and **Log In** options.  

### 2. **User Authentication**  
#### **Sign Up**  
- Users sign up using **email and password**.  
- After successful registration, users are redirected to the **Chat Dashboard**.  

#### **Log In**  
- Users enter their **email and password** to log in.  
- If successful, they land on the **Chat Dashboard**.  

### 3. **Chat Dashboard**  
- Displays a **list of recent chats**.  
- Provides a **search bar** to find users and start new chats.  

### 4. **Searching & Adding Users**  
- Users can search for **other users by name or email**.  
- Clicking on a user opens a **chat window**.  

### 5. **Chat Features**  
- **Send & receive text messages** in real-time.  
- **Basic read receipts** (optional).  

### 6. **Logout**  
- Users can securely log out from the **Dashboard**.  

## Key Features  
✔ **User registration & login**  
✔ **Simple real-time chat**  
✔ **User search for starting conversations**  
✔ **Minimalist UI**  

---

This structured document provides a **clear roadmap** for the app's flow and features for easy implementation. 🚀
