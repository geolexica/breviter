# Introduction

This project is funded by NLnet to develop a reverse semantic search engine (including experiments and a report of the experiment results).

The project proposal (including plan and deliverables) can be found on the Google drive.

# Current status

The database of the Geolexica is (asynchornizely) imported to the project. The AI model for English is done. A demo (for English) and a simple testing platform are ready.

# Instructions

## The geolexica database

The entries of Geolexica in YAML format are located in the folder 'data'. To update the database, simply update the records in the folder there.

## The (English) AI model

We are using Tensorflow.js (the JS version of Tensorflow) and the mobile version of the pre-trained model. See the paper (2020) MobileBERT: a Compact Task-Agnostic BERT for Resource-Limited Devices by Zhiqing Sun, Hongkun Yu, Xiaodan Song, Renjie Liu, Yiming Yang, and Denny Zhou for details about the model. In short, it is a compact version and so execution of the model is faster with a minimal tradeoff in accuracy.

The model is located in the 'sent' folder under the 'public' folder. To update the model, simply replace the model files in this folder.

## Starting this application

The app uses next.js. Suppose yarn is used for package management. To start the app, first install all the dependencies

```
yarn install
```

Then, start the web server

```
yarn dev
```

To access the app, use any browser and go to

```
localhost:3000
```

## UI #1: Reverse search demo

Currently, there are two UIs. One is a demo of how reverse search could work. It is located at

```
localhost:3000/reverse
```

It uses the database of Geolexica and the English definitions. The result is a list of words with the highest simiarity scores with the given search phrase.

## UI #2: Experiment platform (for English)

The other UI is for performing experiments and collect the accuracy data for the report. It is located at

```
localhost:3000/testing
```

It reads a file that contains numerous test cases. **Each test should be on a seperate line**. Each test case has two items, seperated by a semicolon ``;``. The first part is the search phrase of the test case. The second part is the expected resulted term. For example, if the search phrase is `terms not in use` and the expected result is `obsolete term`, the test case should be written as

```
terms not in use;obsolete term
```

Samples of the test cases can be found in the 'testcases' folder under the 'public' folder.

# Todo

1. Prepare some testcases. See above for the format of the testcase.

1. Collect accuracy statistics of our platform and compare to the existing competitors ([Reverse dictionary](https://reversedictionary.org/) and [OneLook](https://www.onelook.com/reverse-dictionary.shtml)). As there is no API from the competitors, we either need to perform the tests manually or write some scripts to do the tests. To collect the accuracy statistics of our platform, we can use UI #2.


1. Supporting other languages. Currently, there is only English model that is publicly available for the Tensorflow.js format. To achieve this, there are two possible ways that are simple enough. First, there are models for other languages in other formats. There could be transformer tools to transform models of other format into the formats supported by Tensorflow.js. Second, there could be JS/TS reader APIs that load AI models that can be used by Tensorflow.js. This problem is probably faced by many other developers but I haven't studied in depth in this area yet.

# Recourses

Tensorflow.js sample applications

```
https://github.com/tensorflow/tfjs-models
```

Off-the-shelf Tensorflow models can be found at

```
https://tfhub.dev
```

Note: the TF.js format is for Tensorflow. Other formats are not directly usable by Tensorflow.js, to my knowledge. More details about the format can be found [here](https://www.tensorflow.org/hub/model_formats).


Here is the link to the original BERT model and paper from Google.
```
https://github.com/google-research/bert
```

In fact, there is a multilingual version of the model that supports 102 languages in one single model. Not sure how to make it usable in the current application. Didn't have time to study it in details. Probably worth to study how to make it usable in a web environment.

# Possible alternative solution

The multilingual BERT model is native to python. Maybe it is simpler if the web can invoke some python codes.