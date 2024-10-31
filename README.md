# Set Up Guide for AccessibleT3

This guide will help you set up the AccessibleT3 project on your local machine. Please follow each step carefully.

## Prerequisites

Before you begin, ensure you have the following software installed on your device:

1. **Docker**:

   - Follow the official installation instructions for your operating system:
     - **[Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)**
     - **[Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)**
     - **[Docker Engine for Linux](https://docs.docker.com/engine/install/)**
   - After installation, verify that Docker is working by running the following command in your terminal or command prompt:
     ```bash
     docker --version
     ```

2. **Git**:
   - Install Git from the official website:
     - **[Download Git](https://git-scm.com/downloads)**
   - Verify the installation by running:
     ```bash
     git --version
     ```

## Clone the Project

1. Open your terminal or command prompt.

2. Choose a directory where you want to clone the project. For example, you can navigate to your `Documents` folder:

   ```bash
   cd Documents
   ```

3. Clone the project repository by executing the following command:

   ```bash
   git clone https://github.com/Kokseng1/AccessibleT3
   ```

4. After cloning, navigate into the project directory:
   ```bash
   cd AccessibleT3
   ```

## Build and Run the Application

1. Ensure that Docker is running. You can check this by looking for the Docker icon in your system tray or taskbar.

2. Build and start the application using Docker Compose with the following command:

   ```bash
   docker-compose up --build
   ```

   The terminal will display logs from the application, which can help in troubleshooting if needed.

3. Wait for the process to complete. Once you see output indicating that the application is up and running, you can access the application in your web browser.

## Access the Game

1. Open your web browser and navigate to:
   </br> `http://localhost:3000`
2. You can interact with the game as a player. To test multiplayer functionality:

- Open multiple tabs in the same browser.
- Alternatively, use different browsers (like Chrome and Firefox) or incognito/private mode in your browser to simulate multiple players.
