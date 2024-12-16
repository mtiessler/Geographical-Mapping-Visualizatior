# React App with Docker and CI/CD

This project is a React application that uses **TypeScript**, **SCSS** for styling, and **React Router** for navigation. The application has a main menu and four views. It supports running locally or using Docker, and includes a CI/CD pipeline for deployment to AWS Amplify and Docker Hub.

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Running Locally](#running-locally)
3. [Running via Docker](#running-via-docker)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Folder Structure](#folder-structure)

---

## Project Setup

### Prerequisites

Ensure the following are installed on your system:

- **Node.js** (v16 or later)
- **npm** (v8 or later)
- **Docker** (v20 or later)

### Install Dependencies

Clone the repository and install project dependencies:

```bash
git clone <repository-url>
cd react-app
npm install
```

---

## Running Locally

To run the React application locally:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## Running via Docker

### Build Docker Image

To build the Docker image:

```bash
docker build -t react-app .
```

### Run Docker Container

Run the container exposing it on port 3000:

```bash
docker run -p 3000:3000 react-app
```

The app will be accessible at `http://localhost:3000`.

---

## CI/CD Pipeline

The project includes a **GitHub Actions** CI/CD pipeline for:

1. Building and pushing the Docker image to **Docker Hub**.
2. Deploying the application to **AWS Amplify**.

### Setting Up CI/CD

1. Add the following **secrets** in your GitHub repository settings:
    - `DOCKER_USERNAME`: Your Docker Hub username.
    - `DOCKER_PASSWORD`: Your Docker Hub password or access token.
    - `AWS_AMPLIFY_APP_ID`: Your AWS Amplify App ID.
    - `AWS_REGION`: AWS Region (e.g., `us-east-1`).
    - `AWS_ACCESS_KEY_ID`: AWS access key.
    - `AWS_SECRET_ACCESS_KEY`: AWS secret key.

2. Push to the `master` branch to trigger the CI/CD pipeline.

---

## Folder Structure

The project is organized as follows:

```plaintext
react-app/
│
├── public/               # Static files
├── src/                  # Source code
│   ├── components/       # React components
│   │   ├── Menu.tsx
│   │   ├── GeoView1.tsx
│   │   ├── GeoView2.tsx
│   │   ├── GeoView3.tsx
│   │   └── GraphView.tsx
│   │
│   ├── data/             # Data files (e.g., CSV)
│   ├── styles/           # SCSS stylesheets
│   ├── App.tsx           # Main App component
│   └── index.tsx         # React entry point
│
├── Dockerfile            # Dockerfile for building the app
├── .github/              # CI/CD workflows
│   └── workflows/
│       └── ci-cd.yml     # GitHub Actions CI/CD workflow
│
├── tsconfig.json         # TypeScript configuration
├── package.json          # Project dependencies
├── .gitignore            # Files to ignore in Git
└── README.md             # Project documentation
```