# Breviter: reverse semantic search for Geolexica

Breviter is the reverse semantic search for Geolexica.

## Purpose

Ever forgotten a specific word but could describe its meaning?
Internet search engines more than often return unrelated entries. The solution
is reverse semantic search: given an input of the meaning of the word (search
phrase), provide an output with dictionary words that match the meaning.

This often happens especially in technical domains and in standardization
vocabulary, where terms can be highly specific and difficult to locate without
specialized knowledge.

The key to accurate reverse search lies in the machine's ability to understand
semantics. Geolexica employs deep learning approaches in natural language
processing (NLP) to enable better comparison of meanings between the search
phrases with word definitions. Accuracy will be significantly increased.

The ability to identify entities with similar semantics facilitates ontology
discovery in the Semantic Web and in Technical Language Processing (TLP).

## Supporters

This project is funded by NLnet to develop a reverse semantic search engine
(including experiments and a report of the experiment results).

The project proposal (including plan and deliverables) can be found on our
Google drive.

## Current status

* The Geolexica ISO/TC 211 concepts database is submoduled under this repo.
* The AI model for English is done.
* A demo (for English) and a bulk test platform are provided.
* We need to deploy the demo on isotc211.geolexica.org


## Architecture

### Geolexica database

The ISO/TC 211 Geolexica concept dataset (YAML) is submoduled under 'data/'.

To update the database, simply go inside 'data/' and run ``git pull``.

### The (English) AI model

We use [Tensorflow.js](https://www.tensorflow.org/js) (the JavaScript version of
Tensorflow).

The pre-trained model used is MobileBERT:
* From the paper (2020) MobileBERT: a Compact Task-Agnostic BERT for
  Resource-Limited Devices by Zhiqing Sun, Hongkun Yu, Xiaodan Song, Renjie Liu,
  Yiming Yang, and Denny Zhou for details about the model.

MobileBERT, is a compact version of BERT and so execution of the model is faster
with a minimal tradeoff in accuracy.

The model is located in the 'sent' folder under the 'public' folder. To update
the model, simply replace the model files in this folder.

### Application

The demo application is developed using [Next.js](https://nextjs.org).

It loads the Geolexica dataset, its pre-computed vectors
and MobileBERT in the browser.

There are two implemented UIs:
* Single search interface
* Bulk search interface


## Usage

### Starting the demo application

The [Yarn package manager](https://yarnpkg.com) is used for package management.

To start the app, first install all the dependencies:

```
yarn install
```

Then, start the web server:

```
yarn dev
```

To access the app, use any browser and go to:

```
localhost:3000
```


### UI #1: Single reverse search

The single reverse search interface is located at:

```
localhost:3000/reverse
```

It uses the Geolexica concepts dataset with the English definitions.

The result is a list of words with the highest similarity scores with a given
search phrase.


## UI #2: Bulk search with scores

The bulk search interface is meant for performing experiments and collecting
accuracy data for the report.

It is located at:

```
localhost:3000/testing
```

This interface requires uploading a file that contains multiple test cases.

The structure of the file is:
* **Each test should be on a separate line**.
* Each test case has two items, separated by a semicolon ``;``.
  * The first part is the search phrase of the test case.
  * The second part is the expected resulted term.

For example, if the search phrase is `terms not in use` and the expected result
is `obsolete term`, the test case should be written as

```
terms not in use;obsolete term
```

Samples of the test cases can be found under the 'public/testcases/' directory.


## Todos

1. Prepare additional test cases.

1. Collect accuracy statistics of our platform and compare to the existing competitors ([Reverse dictionary](https://reversedictionary.org/) and [OneLook](https://www.onelook.com/reverse-dictionary.shtml)). As there is no API from the competitors, we either need to perform the tests manually or write some scripts to do the tests. To collect the accuracy statistics of our platform, we can use UI #2.

1. Supporting other languages. Currently, there is only English model that is publicly available for the Tensorflow.js format. To achieve this, there are two possible ways that are simple enough. First, there are models for other languages in other formats. There could be transformer tools to transform models of other format into the formats supported by Tensorflow.js. Second, there could be JS/TS reader APIs that load AI models that can be used by Tensorflow.js. This problem is probably faced by many other developers but I haven't studied in depth in this area yet.


## Resources

Tensorflow.js pre-trained models are available at:
* https://github.com/tensorflow/tfjs-models

Off-the-shelf Tensorflow models can be found at:
* https://tfhub.dev

NOTE: The Tensorflow.js model format is specific -- normal Tensorflow models
must be converted to this format for them to be useable. Non-Tensorflow formats
are not directly usable by Tensorflow.js. More details about the format can be
found [here](https://www.tensorflow.org/hub/model_formats).


Link to the original BERT model and paper from Google:
* https://github.com/google-research/bert

While there is a multilingual version of the model that supports 102 languages
in one single model, it is unsure how we can make it usable in the current
application.

Didn't have time to study it in details. Probably worth to study how to make it
usable in a web environment.

### Possible alternative solution

The multilingual BERT model is native to python. Maybe it is simpler if the web
can invoke some python codes.
