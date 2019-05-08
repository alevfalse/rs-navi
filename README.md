# rs-navi
A web application that helps students find a place to live near their school.  
https://rsnavigation.com

![RS Navi Logo](https://raw.githubusercontent.com/alevfalse/rs-navi/master/src/public/images/logo_with_title.png)

# Development Guide
1. Clone the repository to your local machine using the command:
> git clone https://github.com/alevfalse/rs-navi.git

2. Go to the clone repository's project folder and install all dependencies using the command:
> npm install

3. Create your *.env* file in the project folder and insert all environment variables needed.

4. Start coding and don't forget to commit and push your changes.
> git commit -m "commit message"

> git push

To pull any changes others have made use the comand:
> git pull

## Running the server during development
You can run the application on a local server using the command:
> npm run dev

Note: The command above will start the nodemon module, which means that you do not have 
to restart the server whenever any changes are saved.

## Running the server during production
For official release, set your MODE environment variable to "prod" then run:
> npm start

