const express = require('express');
const cors = require('cors');
const pg = require('pg');
const Joi = require('joi');
const validate = require('celebrate');
const bodyParser = require('body-parser');
const data2xml = require('data2xml');
const convert = data2xml();

require('dotenv').config({silent:true});

const cors_options = {
  origin: process.env.WEB_APP, //TODO: change WEB_APP value based on android studio port
  optionsSuccessStatus: 200
};

const app = express();
const port = process.env.EX_PORT;

//Database connection config
const pool = new pg.Pool({
  user: process.env.PG_USER,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  max: process.env.PG_MAX_CLIENTS,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT
});

pool.on('error', (err, client) => {
  console.log('Idle client error', err.message, err.stack);
});

app.use(cors()); //TODO: use cors_options
app.use(bodyParser.json());

// Handle 'GET' request to sync latest questionnaire version from projects / city database
app.get('/form/:org/:city/:proj', validate({
  params: {
    org: Joi.string().valid('urbanrisklab'),
    city: Joi.string().valid('Cambridge'),
    proj: Joi.string().valid('testing')
  }
}), (req, res) => {
  //use parameters to query database tables, fetch row with latest version JSON,
  //accompanying choice lists, metadata (version, etc.)...
  //use xml-js convert method to create xml, append parameters, version, etc.
  //construct response with raw xml string
  console.log("Received form request");
  var query_string = "SELECT * FROM skanda.survey_questions WHERE org = '" + req.params.org + "' AND city = '" + req.params.city + "' AND project = '" + req.params.proj + "' ORDER BY version DESC LIMIT 1;";
  pool.connect((err, client, done) => {
    if (err) {
      console.log("database err: " + err);
      done();
      callback(new Error('Database connection error'));
      return;
    }
    var query = client.query(query_string);
    query.on('row', (row, result) => {
      result.addRow(row);
    });
    query.on('end', result => {
      var questionnaire = result.rows[0].questionnaire;
      var sections = questionnaire.resources.groups.group;
      // Make deep copy
      var choicelists = JSON.parse(JSON.stringify(result.rows[0].choicelists.choicelists));

      // Append declaration
      questionnaire._declaration = {
        "_attributes": {
          "version": "1.0",
          "encoding": "UTF-8"
        }
      };

      // Append metadata
      questionnaire.resources.metadata = {
        title: "Housing survey",
        version: result.rows[0].version,
        organisation: result.rows[0].org,
        city: result.rows[0].city,
        project: result.rows[0].project,
        idfield: [
          "Location - Ward No / Name",
          "Name of Slum",
          "House / Flat / Door No."
        ]
      };

      for (let section in sections) {
        // Search for question in non-repeatable groups
        if ('question' in sections[section]) {
          for (let q in sections[section].question) {
            // Replace choicelist property with choices from DB > choicelists
            if ('choicelist' in sections[section].question[q]) {
              sections[section].question[q].choices = JSON.parse(JSON.stringify(choicelists[sections[section].question[q].choicelist].choices));
              delete sections[section].question[q].choicelist;
              // Add dependents property for each choice, remove dependencies property from question
              if ('dependencies' in sections[section].question[q]) {
                for (let dependency in sections[section].question[q].dependencies) {
                  for (let c in sections[section].question[q].choices.choice) {
                    if (sections[section].question[q].choices.choice[c].ccode === dependency) {
                      sections[section].question[q].choices.choice[c].dependents = sections[section].question[q].dependencies[dependency];
                    }
                  }
                }
                delete sections[section].question[q].dependencies;
              }
            }
          }
        // else search for rchunk in repeatable groups
        } else if ('rchunk' in sections[section]) {
          for (let r in sections[section].rchunk) {
            if ('rquestion' in sections[section].rchunk[r]) {
              for (let rq in sections[section].rchunk[r].rquestion) {
                // Replace choicelist property with choices from DB > choicelists
                if ('choicelist' in sections[section].rchunk[r].rquestion[rq]) {
                  sections[section].rchunk[r].rquestion[rq].choices = JSON.parse(JSON.stringify(choicelists[sections[section].rchunk[r].rquestion[rq].choicelist].choices));
                  delete sections[section].rchunk[r].rquestion[rq].choicelist;
                  // Add dependents property for each choice, remove dependencies property from question
                  if ('dependencies' in sections[section].rchunk[r].rquestion[rq]) {
                    for (let dependency in sections[section].rchunk[r].rquestion[rq].dependencies) {
                      for (let rc in sections[section].rchunk[r].rquestion[rq].choices.choice) {
                        if (sections[section].rchunk[r].rquestion[rq].choices.choice[rc].ccode === dependency) {
                          sections[section].rchunk[r].rquestion[rq].choices.choice[rc].dependents = sections[section].rchunk[r].rquestion[rq].dependencies[dependency];
                        }
                      }
                    }
                    delete sections[section].rchunk[r].rquestion[rq].dependencies;
                  }
                }
              }
            }
          }
        }
      }
      var xml_result = convert('resources', questionnaire.resources);
      res.send(xml_result);
    });
  });
});

// Handle 'POST' request for '/test'
app.post('/test', (req, res) => {
    console.log("Received request from app");
  }
);


// Handle 'POST' request to insert a new questionnaire
// validation & error checking... json type, questionnaire format, choicelists format???
// INSERT INTO skanda.survey_questions (questionnaire, choicelists, id, timestamp, version, author, project, city, org)
// VALUES ('questionnaire.json {}', 'choicelists.json {}', DEFAULT, '2017-05-20 19:15:06', '0.1', 'mayank.ojha', 'testing', 'Cambridge', 'Urban Risk Lab')
// JSON must be in single quotes, double up single quotes within json text (escape) eg: (don't know becomes don''t know)


// 'POST' request for completed survey sync, (INDIVIDUAL)
// check schema for values & params.

app.listen(port, (err) => {
  if (err) {
    return console.log('Something\'s not right!', err);
  }
  console.log('Server is listening on http://localhost:' + port);
});

// Handle not found errors
app.use((req, res) => {
  res.status(404).json({ message: 'URL not found', url: req.url });
});
