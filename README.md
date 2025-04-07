# Streaming Live Demo by D-ID (tested 4/5/25)
## Please consider leaving as star :)

https://youtu.be/VhSG-KOyQow
![image](https://github.com/user-attachments/assets/ad8770be-aee8-435e-a0bf-c34839e07604)

## Initial Setup:
* (install express) open a terminal in the folder:
    **run this: npm install express
    **run this: npm install openai
    **run this: npm install base64
* (add your d-id api key and openai key etc) edit the `api.json` file
* ![image](https://github.com/user-attachments/assets/7f35b777-e502-462c-9295-88e9a58d488a)

* Run a test to ensure yor D-id api key is set correctly by checking d-id credit balance:  node test_d_id.js
* Run a test to ensure yor Openai api key is set correctly by checking ChatGPT:  node test_openai.js
* Got issues?  Cut and paste to ChatGPT etc and ask for assistance
* Note: Both tests must woprk before proceeding or you will get frustrated 

## Image files
* the idle video can be replaced with your idle video in index.html
![image](https://github.com/user-attachments/assets/a98a567a-1c60-4461-96d9-5c6a96fb482e)

* the Avatar image in streaming-client-api.js also needs to be replaced with yours on a hosted web endpoint
![image](https://github.com/user-attachments/assets/8d8cb943-20cf-4e1a-b23e-1c3eb9028e92)

## OpenAI.js
* be sure to review the model seletion for Openai in the helper file openai.js
* ![image](https://github.com/user-attachments/assets/e5f4dcb8-f988-4e3e-8387-16b4e31c137b)

## Start the demo:
* After testing API key set up as per above
* Open a session in your terminal in the folder with our code run this: node app.js 
* You should see this message - server started on port localhost:3000
* (open index.html app) in the browser add localhost:3000
* (connect) press connect you should see the connection ready 
* (Enter Chat Text) press the start button to start streaming

## Final Thoughts
* Be patient and enjoy the puzzle if things are not working right away -- stay with it you will get it!
* ChatGPT is your friend...  share the code and any errors and ask it for help

![image](https://github.com/user-attachments/assets/c4a0dc9d-b0f7-495e-95d6-502f29ee8b91)

##
![image](https://github.com/user-attachments/assets/06c1dbc1-c30d-4397-b014-ae0fbc50b03c)
