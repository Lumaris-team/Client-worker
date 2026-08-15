<p align="center">
  <img width="155" src="src/frontend/assets/logo/logo.png" style="border-radius: 100px;" />
</p>

<h1 align="center">Lumaris</h1>

<p align="center">
  <strong>Server code for lumaris.fr.eu.org</strong>
</p>

<p align="center">
  <em>Intelligent educational platform for school management and AI-assisted learning</em>
</p>

<p align="center">
  <a href="#-about-this-code">About</a> •
  <a href="#what-you-can-do">What you can do</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#resources">Resources</a>
</p>

---

## 📋 Table of Contents

- [About this code](#-about-this-code)
- [How you received this code](#how-you-received-this-code)
- [What you can do](#-what-you-can-do)
- [Required configuration](#required-configuration)
- [Project structure](#project-structure)
- [Customization](#customization)
- [Deployment](#deployment)
- [Support](#support)

---

## 🎯 About this code

You are viewing the server source code that powers the **lumaris.fr.eu.org** website. This code was automatically assigned to your Cloudflare account when the site was created.

### What is Lumaris?

Lumaris is a comprehensive educational platform that offers students:

- **School Management**: Integration with ÉcoleDirecte for grades, homework, and timetable
- **AI Assistant**: Intelligent tutoring and homework help using Cloudflare Workers AI
- **Workspace**: File management, study notes, and organizational tools
- **Notifications**: Real-time alerts for important academic events
- **Customization**: Personalized dashboard with extensive configuration options

### Technical architecture

This code is deployed on **Cloudflare Workers**, a serverless computing platform that offers:

- **Global Performance**: Code runs on servers worldwide
- **Automatic Scalability**: Automatically handles traffic spikes
- **Integrated Database**: D1 (SQLite-compatible) for data storage
- **Cloud Storage**: MEGA.nz integration for files
- **Cutting-edge AI**: Workers AI for AI features

---

## 🔧 How you received this code

This code was automatically assigned to your Cloudflare account when the **lumaris.fr.eu.org** site was created.

The process works as follows:
1. You created the site on Cloudflare
2. Cloudflare automatically deployed this server code
3. The code is now associated with your account
4. You can modify, improve, or customize it

This is an automatic distribution that allows everyone to have their own Lumaris environment.

---

## 🎯 What you can do

### Use the site

The **lumaris.fr.eu.org** site is already functional! You can:

- **Log in** with your email account
- **Access your grades** via ÉcoleDirecte integration
- **Use the AI assistant** for your homework
- **Manage your files** in the workspace
- **Customize the interface** according to your preferences

### Modify the code

If you want to customize the server code:

1. **Clone this repository** to your local machine
2. **Install dependencies** with `npm install`
3. **Modify files** according to your needs
4. **Deploy changes** with `wrangler deploy`

> ⚠️ **Important**: Any code modification can affect site functionality. Make sure you understand the changes before deploying.

---

## ⚙️ Required configuration

### Environment variables

The code requires several configurations in your Cloudflare account:

**Required services:**
- **Supabase**: For user authentication
- **Cloudflare Workers AI**: For AI features
- **Cloudflare D1**: For the database
- **Cloudflare KV**: For caching

**Configuration in `wrangler.toml`:**
```toml
name = "dashboard"
main = "src/index.js"
compatibility_date = "2026-05-22"
workers_dev = true
compatibility_flags = ["nodejs_compat"]

[vars]
MODE = "production"
SITE = "enabled"
JWT_SECRET = "your_secure_random_key"
JWT = "your_secure_random_key"
```

### Database

The code uses **Cloudflare D1** with the following tables:
- `customization`: User settings
- Additional tables depending on enabled features

---

## 📁 Project structure

```
client-worker/
├── src/
│   ├── index.js                 # Main entry point
│   ├── frontend/                # User interface
│   │   ├── assets/            # Images, videos, icons
│   │   ├── components/        # Reusable components
│   │   ├── lib/               # JavaScript libraries
│   │   ├── pages/             # Application pages
│   │   └── styles/           # CSS styles
│   ├── backend/               # Server services
│   │   ├── auth/             # Authentication
│   │   ├── ai/               # AI services
│   │   ├── cache/            # Cache
│   │   ├── database/         # Database operations
│   │   ├── ecole_directe/    # School integration
│   │   ├── notifications/    # Notifications
│   │   ├── settings/         # Settings
│   └── tools/            # Utility tools
│   └── workflows/            # Background tasks
├── migrations/               # Database migrations
├── package.json             # Dependencies
├── wrangler.toml           # Cloudflare configuration
└── README.md               # This file
```

For more details on each module, consult the corresponding README files in each directory.

---

## 🎨 Customization

### Modify appearance

You can customize the interface by modifying files in `src/frontend/`:
- **Pages**: Modify `src/frontend/pages/` to change content
- **Styles**: Modify `src/frontend/styles/` to change appearance
- **Components**: Modify `src/frontend/components/` for reusable elements

### Add features

To add new features:
1. Create a new module in `src/backend/`
2. Add routes in `src/index.js`
3. Update the database if necessary
4. Test locally before deployment

---

## 🚀 Deployment

### Local development

```bash
# Install dependencies
npm install

# Start local server
wrangler dev
```

### Production deployment

```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Deploy to specific environment
wrangler deploy --env production
```

### Database migrations

```bash
# Apply migrations
wrangler d1 execute customization --file=./migrations/0001_create_customization_table.sql
```

---

## 📚 Resources

### Detailed documentation

For complete technical documentation, consult the READMEs in each directory:
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/README.md" /> - Source code
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/frontend/README.md" /> - Frontend
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/backend/README.md" /> - Backend

### Useful links

- **Main site**: https://lumaris.fr.eu.org
- **Cloudflare Workers documentation**: https://developers.cloudflare.com/workers/
- **Cloudflare D1 documentation**: https://developers.cloudflare.com/d1/
- **Supabase documentation**: https://supabase.com/docs

---

## 🔒 Security

### Personal data

This code respects data protection principles:
- **Secure authentication** via Supabase
- **Bot protection** via Turnstile
- **Encrypted sensitive data**
- **GDPR compliance** for European users

### Best practices

- Don't modify secret keys without knowing what you're doing
- Backup your configuration before modifications
- Always test changes in local environment
- Monitor logs to detect anomalies

---

## 🆘 Support

### Common issues

**Site not working:**
- Verify your Cloudflare account is active
- Check environment variables
- Consult logs in Cloudflare dashboard

**AI features not available:**
- Verify Workers AI is enabled on your account
- Check your usage limits
- Verify API configuration

**ÉcoleDirecte connection issues:**
- Verify your ÉcoleDirecte credentials
- Check API accessibility
- Consult ÉcoleDirecte documentation

### Getting help

For technical questions or issues:
- Consult Cloudflare documentation
- Check logs and errors
- Contact support if necessary

---

## 📄 License

This code is distributed under MIT license. You are free to modify and adapt it to your needs.

---

## 📝 Important notes

- This code is an automatic distribution for lumaris.fr.eu.org
- Your modifications only affect your instance
- Make sure you understand the implications of changes
- Regularly backup your configuration
- Stay informed about security updates

---

## 🛠️ Technologies used

- **Cloudflare Workers**: Serverless computing platform
- **Workers AI**: Cutting-edge artificial intelligence
- **D1 Database**: SQLite-compatible database
- **KV Storage**: Key-value storage for caching
- **Supabase**: Authentication and user management
- **MEGA.nz**: Cloud storage for files
- **ÉcoleDirecte API**: French school system integration

---

<p align="center">
  <strong>Welcome to Lumaris!</strong>
</p>

<p align="center">
  <em>This server code allows you to customize your experience on lumaris.fr.eu.org</em>
</p>

<p align="center">
  <a href="https://lumaris.fr.eu.org">🌐 Visit the site</a> •
  <a href="https://developers.cloudflare.com/workers/">📚 Cloudflare documentation</a>
</p>