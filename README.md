
## 📋 Backend of Finance Control Mern App

### 3. [Equilibrio Financeiro](https://equilibriofinanceiro.web.app/)
- **Description**: A multi-tenant financial control application where users can manage their finances, track income and expenses, and visualize data with charts and PDF exports. It integrates with Stripe for payments and includes user authentication Google.
- 
- **Before Deployment**:  
   - Clear logs
    - check cors
    - check limiter
    - check cookies
    - check imports
    - delete comments
    - Organize imports
    - check env.config
    - check mongoDb authorized IP's
    - Check packages installed
    - Run Build
    - Uncomment mongoose connection
    - Environment variable on render is already set to production
    - Package.json scripts: (render.com does not support "SET" because it runs on unix ), but environment variables are              already set to production on its dashboard.

    "scripts": {  
    "build": "tsc",  
    "test": "echo \"Error: no test specified\" && exit 1",  
    "dev": "nodemon",  
    "start": "SET NODE_ENV=development& nodemon",  
    //"start": "node dist/server.js",  
    "start_prod": "SET NODE_ENV=production& nodemon"},  

 
- **Use in Development**:  
    - npm run start_dev
    - check package.json scripts
    - check cors

---


