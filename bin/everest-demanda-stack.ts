#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TblDemanda } from '../lib/TblDemanda';
import { DemandaBucket } from '../lib/DemandaBucket';
import { ScheduledLambdas } from '../lib/ScheduledLambdas';
import { SasAns } from '../lib/SasAns';
import { TblAdmCliente } from '../lib/TblCliente';
import { Users } from '../lib/Users';
import { Cognito } from '../lib/Cognito';
import { CustomRole } from '../lib/CustomRole';
import { TblEvento } from '../lib/TblEvento';
import { TblRastreamentoNup } from '../lib/TblRastreamentoNup';
import { SqsBackend } from '../lib/SqsBackend';
import { Props } from '../lib/Props';
import { SnsBackend } from '../lib/SnsBackend';
const pjson = require('../package.json');

const app = new cdk.App();

const Environment = pjson.Environment;

const env: cdk.Environment = {
  account: pjson.account,
  region: pjson.region,
};

const tags: {
  Project: string;
  Environment: string;
  Description: string;
  RoleArn: string;
} = {
  Project: pjson.Project,
  Environment: Environment,
  Description: `https://bitbucket.org/henriqueserraoito/everest-${Environment.toLowerCase()}-${
    pjson.StackName
  }/src/main/`,
  RoleArn: ``,
};

tags.RoleArn = `arn:aws:iam::028901343047:role/everest-demanda-${Environment.toLowerCase()}`;

const description = tags.Description;

const customRole = new CustomRole(app, `Everest${tags.Environment}CustomRole`, {
  env,
  tags,
  description,
});

const cognito = new Cognito(app, `Everest${tags.Environment}Cognito`, {
  env,
  tags,
  description,
});

// Users
const users = new Users(app, `Everest${tags.Environment}Users`, {
  env,
  tags,
  description,
});

const tblAdmCLiente = new TblAdmCliente(app, `Tbl${tags.Environment}AdmCliente`, {
  env,
  tags,
  description,
});

const demandaBucket = new DemandaBucket(app, `Bucket${tags.Environment}DemandaBucket`, {
  env,
  tags,
  description,
});

const tblDemanda = new TblDemanda(app, `Tbl${tags.Environment}Demanda`, {
  env,
  tags,
  description,
});

new SnsBackend(app, `Everest${tags.Environment}SnsBackend`, {
  env,
  tags,
  description,
});

/* ---------------------------- Excluídas em Dev --------------------------- */
if (tags.Environment === 'Prod') {
  // SasAns
  new SasAns(app, `Lambda${tags.Environment}SasAns`, {
    env,
    tags,
    description,
  });

  const scheduledLambdas = new ScheduledLambdas(app, `Lambda${tags.Environment}ScheduledLambdas`, {
    env,
    tags,
    description,
    customRole: customRole.customRole,
  });
}
/* -------------------------------------------------------------------------- */

new TblEvento(app, `Tbl${tags.Environment}Evento`, {
  env,
  tags,
  description,
});

new TblRastreamentoNup(app, `Tbl${tags.Environment}RastreamentoNup`, {
  env,
  tags,
  description,
});

new SqsBackend(app, `Everest${tags.Environment}SqsBackend`, {
  env,
  tags,
  description,
});

new Props(app, `Everest${tags.Environment}Props`, {
  env,
  tags,
  description,
});
