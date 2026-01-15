// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import * as cedar from '@cedar-policy/cedar-wasm/nodejs';
import {
  Context,
  Decision,
  DetailedError,
  TypeAndId,
} from '@cedar-policy/cedar-wasm';

import * as path from 'node:path';
import { expect, test, beforeAll, suite } from 'vitest';
import { getCedarStuff } from '../cedar-util';

suite('Cedar WASM', async () => {
  test('SDK version: 4.4.0', () => {
    expect(cedar.getCedarVersion()).toBe('4.4.0');
  });
});

// schema, policies, entities
const PHOTOAPP_PATH = path.resolve(__dirname);
const { schema, policies, entities } = getCedarStuff(PHOTOAPP_PATH);

suite('Cedar validation', () => {
  test('parse Schema', () => {
    let errorMessage;
    const answer = cedar.checkParseSchema(schema);
    if (answer.type == 'failure') {
      errorMessage = `${answer.errors.map((err: DetailedError) => `- ${err.message}`).join('\n')}`;
    }
    expect(answer.type, errorMessage).toBe('success');
  });

  test('parse Entities', () => {
    let errorMessage;
    const answer = cedar.checkParseEntities({
      schema: schema,
      entities: entities,
    });
    if (answer.type == 'failure') {
      errorMessage = `${answer.errors.map((err: DetailedError) => `- ${err.message}`).join('\n')}`;
    }
    expect(answer.type, errorMessage).toBe('success');
  });

  test('validate PolicySet', () => {
    let errorMessage;
    const answer = cedar.validate({
      validationSettings: { mode: 'strict' },
      schema: schema,
      policies: policies,
    });
    if (answer.type == 'failure') {
      errorMessage = `${answer.errors.map((err: DetailedError) => `- ${err.message}`).join('\n')}`;
    }
    expect(answer.type, errorMessage).toBe('success');
    if (answer.type == 'success') {
      expect(answer.validationErrors).toHaveLength(0);
    }
  });
});

// principals
const JANEDOE: TypeAndId = { type: 'PhotoApp::User', id: 'JaneDoe' };
const JOHNDOE: TypeAndId = { type: 'PhotoApp::User', id: 'JohnDoe' };
const JORGESOUZA: TypeAndId = { type: 'PhotoApp::User', id: 'JorgeSouza' };

// resources
const JANEDOE_JPG: TypeAndId = { type: 'PhotoApp::Photo', id: 'JaneDoe.jpg' };
const JOHNDOE_JPG: TypeAndId = { type: 'PhotoApp::Photo', id: 'JohnDoe.jpg' };
const NIGHTCLUB_JPG: TypeAndId = {
  type: 'PhotoApp::Photo',
  id: 'nightclub.jpg',
};
const SUNSET_JPG: TypeAndId = { type: 'PhotoApp::Photo', id: 'sunset.jpg' };
const JUDGES_JPG: TypeAndId = { type: 'PhotoApp::Photo', id: 'Judges.jpg' };

// actions
const VIEW_PHOTO: TypeAndId = { type: 'PhotoApp::Action', id: 'viewPhoto' };
const EDIT_PHOTO: TypeAndId = { type: 'PhotoApp::Action', id: 'editPhoto' };
const DELETE_PHOTO: TypeAndId = { type: 'PhotoApp::Action', id: 'deletePhoto' };

function expectIsAuthorized(
  decision: Decision,
  principal: TypeAndId,
  action: TypeAndId,
  resource: TypeAndId,
  context: Context = {},
) {
  const answer = cedar.isAuthorized({
    principal: principal,
    action: action,
    resource: resource,
    context: context,
    policies: policies,
    entities: entities,
  });

  expect(answer.type).toBe('success');
  expect(answer.type).toBe('success');
  if (answer.type === 'success') {
    expect(answer.response.decision).toBe(decision);
  }
}

suite('Album DoePhotos', () => {
  test('JaneDoe view JohnDoe.jpg', () => {
    expectIsAuthorized('allow', JANEDOE, VIEW_PHOTO, JOHNDOE_JPG);
  });

  test('JohnDoe view JaneDoe.jpg', () => {
    expectIsAuthorized('allow', JOHNDOE, VIEW_PHOTO, JANEDOE_JPG);
  });

  test('JorgeSouza view JaneDoe.jpg', () => {
    expectIsAuthorized('deny', JORGESOUZA, VIEW_PHOTO, JANEDOE_JPG);
  });
});

suite('Photo owner', () => {
  test('JaneDoe view JohnDoe.jpg', () => {
    expectIsAuthorized('allow', JANEDOE, VIEW_PHOTO, JANEDOE_JPG);
  });
  test('JaneDoe edit JaneDoe.jpg', () => {
    expectIsAuthorized('allow', JANEDOE, EDIT_PHOTO, JANEDOE_JPG);
  });
  test('JaneDoe delete JaneDoe.jpg', () => {
    expectIsAuthorized('allow', JANEDOE, DELETE_PHOTO, JANEDOE_JPG);
  });

  test('JohnDoe view JaneDoe.jpg', () => {
    expectIsAuthorized('allow', JOHNDOE, VIEW_PHOTO, JANEDOE_JPG);
  });
  test('JohnDoe edit JaneDoe.jpg', () => {
    expectIsAuthorized('deny', JOHNDOE, EDIT_PHOTO, JANEDOE_JPG);
  });
  test('JohnDoe delete JaneDoe.jpg', () => {
    expectIsAuthorized('deny', JOHNDOE, DELETE_PHOTO, JANEDOE_JPG);
  });
});

suite('Album JaneVacation', () => {
  test('JaneDoe view nightclub.jpg', () => {
    expectIsAuthorized('allow', JANEDOE, VIEW_PHOTO, NIGHTCLUB_JPG);
  });

  test('JohnDoe view nightclub.jpg', () => {
    expectIsAuthorized('deny', JOHNDOE, VIEW_PHOTO, NIGHTCLUB_JPG);
  });

  test('JaneDoe view sunset.jpg', () => {
    expectIsAuthorized('allow', JANEDOE, VIEW_PHOTO, SUNSET_JPG);
  });

  test('JohnDoe view sunset.jpg', () => {
    expectIsAuthorized('allow', JOHNDOE, VIEW_PHOTO, SUNSET_JPG);
  });
});

suite('Role PhotoJudge', () => {
  test('JorgeSouza view sunset.jpg session', () => {
    expectIsAuthorized('allow', JORGESOUZA, VIEW_PHOTO, SUNSET_JPG, {
      judgingSession: true,
    });
  });

  test('JorgeSouza view sunset.jpg nosession', () => {
    expectIsAuthorized('deny', JORGESOUZA, VIEW_PHOTO, SUNSET_JPG, {
      judgingSession: false,
    });
  });
});

suite('User JorgeSouza', () => {
  test('JorgeSouza view Judges.jpg', () => {
    expectIsAuthorized('allow', JORGESOUZA, VIEW_PHOTO, JUDGES_JPG);
  });

  test('JorgeSouza view nightclub.jpg', () => {
    expectIsAuthorized('deny', JORGESOUZA, VIEW_PHOTO, NIGHTCLUB_JPG);
  });

  test('JorgeSouza view sunset.jpg', () => {
    expectIsAuthorized('deny', JORGESOUZA, VIEW_PHOTO, SUNSET_JPG);
  });
});
