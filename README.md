# RakeshNexify Portfolio

A professional full-stack MERN portfolio website for presenting my development services, projects, companies, digital brands, social-media profiles and freelancer-platform presence.

The website is being developed as the official online platform for **RakeshNexify**.

## Project Status

**Currently in active development**

The frontend design foundation, MongoDB Atlas connection and working contact-enquiry system are complete. The next development phases will convert all portfolio content into MongoDB-managed dynamic data and introduce a secure administration dashboard.

## Main Features

- Professional responsive portfolio design
- Reusable React component architecture
- Central website data management
- About and professional profile section
- Development services showcase
- Featured projects and case-study structure
- Companies and digital brands section
- Social-media and freelancer-platform links
- Responsive desktop and mobile navigation
- Real contact-enquiry form
- Backend validation and error handling
- MongoDB Atlas message storage
- Production-ready environment configuration
- Fully dynamic MongoDB-powered website content
- Secure admin authentication and dashboard
- Admin-managed services, projects, companies and brands
- Dynamic social-media and freelancer-platform management
- Section visibility and ordering controls
- Media, SEO and contact-enquiry management

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- JavaScript
- Fetch API

### Backend

- Node.js
- Express.js
- Mongoose
- REST API
- CORS
- dotenv

### Database

- MongoDB Atlas

### Development Tools

- VS Code
- Git
- GitHub
- Nodemon
- Concurrently

## Project Structure

```text
rakeshnexify-portfolio/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── sections/
│   │   │   └── ui/
│   │   ├── data/
│   │   ├── pages/
│   │   └── services/
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

## Contact Enquiry API

### Endpoint

```http
POST /api/contact-messages
```

### Request body

```json
{
  "name": "Client Name",
  "email": "client@example.com",
  "phone": "Optional phone number",
  "service": "mern-development",
  "subject": "Project subject",
  "message": "Complete project requirements"
}
```

Valid enquiries are stored in the MongoDB collection:

```text
rakeshnexify_portfolio
└── contact_messages
```

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/rakeshnexify/rakeshnexify-portfolio.git
```

### 2. Open the project

```bash
cd rakeshnexify-portfolio
```

### 3. Install root dependencies

```bash
npm install
```

### 4. Install frontend dependencies

```bash
npm install --prefix client
```

### 5. Install backend dependencies

```bash
npm install --prefix server
```

## Environment Variables

Create:

```text
client/.env
```

using:

```text
client/.env.example
```

Example:

```env
VITE_API_URL=http://localhost:5000
```

Create:

```text
server/.env
```

using:

```text
server/.env.example
```

Required variables:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
MONGODB_DB_NAME=rakeshnexify_portfolio
```

Never upload real `.env` files, MongoDB passwords or private connection strings to GitHub.

## Run Frontend and Backend Together

```bash
npm run dev
```

Development URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Backend Health Check

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "RakeshNexify Portfolio API is running."
}
```

## Production Build

```bash
npm run build
```

## Current Development Progress

- [x] MERN project foundation
- [x] React and Vite setup
- [x] Express server setup
- [x] Tailwind CSS integration
- [x] Responsive portfolio layout
- [x] Navbar and footer
- [x] Hero section
- [x] About section
- [x] Services section
- [x] Projects section
- [x] Companies and brands section
- [x] Contact section
- [x] MongoDB Atlas integration
- [x] Contact-message API
- [x] Backend form validation
- [x] React contact-form integration
- [ ] Real social-media and freelancer links
- [ ] Professional profile image and assets
- [ ] Project screenshots and live demonstrations
- [ ] Admin authentication
- [ ] Admin dashboard
- [ ] Contact-message management
- [ ] SEO and metadata
- [ ] Deployment and domain connection
- [ ] Dynamic public-content APIs
- [ ] MongoDB content collections
- [ ] Admin login and protected routes
- [ ] Admin dashboard
- [ ] Dynamic profile and website settings
- [ ] Services CRUD management
- [ ] Projects CRUD management
- [ ] Companies and brands CRUD management
- [ ] Social and freelancer links management
- [ ] Section visibility and ordering
- [ ] Media upload and management
- [ ] SEO settings management

## Security

- Secret environment variables are excluded through `.gitignore`
- MongoDB credentials are stored only in server environment variables
- Backend validation prevents invalid contact submissions
- API errors do not expose database credentials or stack traces
- Production CORS settings will be restricted to the live website domain

## Planned Domain

```text
https://rakeshnexify.com
```

## Author

**RakeshNexify**

Developer · Creator · Entrepreneur

- MERN Stack Development
- WordPress Development
- E-commerce Development
- Business Website Development
- Frontend and Backend Development

## License

This project is currently maintained as the official RakeshNexify portfolio website. A public licence may be added later.