// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {
  EntityJson,
  Policy,
  PolicyId,
  PolicySet,
  Template,
  TemplateLink,
} from '@cedar-policy/cedar-wasm';
import * as fs from 'node:fs';
import * as path from 'node:path';

type TemplateLinkJson = {
  template_id: string;
  link_id: string;
  args: Record<string, string>;
};

const parseEntityUid = (uid: string): { type: string; id: string } => {
  const match = uid.match(/^(.+)::"(.+)"$/);
  return { type: match![1], id: match![2] };
};

const getCedarPolicies = (cedarPath: string): PolicySet => {
  const staticPolicies: Record<PolicyId, Policy> = {};
  const templates: Record<PolicyId, Template> = {};
  const templateLinks: TemplateLink[] = [];
  const files = fs.readdirSync(cedarPath);
  for (const file of files) {
    if (path.extname(file) === '.cedar') {
      const filePath = path.join(cedarPath, file);

      const content = fs.readFileSync(filePath, 'utf8');
      if (filePath.endsWith('.template.cedar')) {
        templates[file] = content;
      } else {
        staticPolicies[file] = content;
      }
    } else if (
      path.basename(file) === 'cedartemplatelinks.json' ||
      path.basename(file).endsWith('.cedartemplatelinks.json')
    ) {
      const filePath = path.join(cedarPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const links = JSON.parse(content).map((link: TemplateLinkJson) => ({
        templateId: link.template_id,
        newId: link.link_id,
        values: Object.fromEntries(
          Object.entries(link.args).map(([k, v]) => [
            k,
            parseEntityUid(v as string),
          ]),
        ),
      }));
      templateLinks.push(...links);
    }
  }
  return {
    staticPolicies: staticPolicies,
    templates: templates,
    templateLinks: templateLinks,
  };
};

export const getCedarStuff = (
  cedarPath: string,
): {
  schema: string;
  policies: PolicySet;
  entities: Array<EntityJson>;
} => {
  const SCHEMA_FILE = path.resolve(cedarPath, 'cedarschema');
  const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');

  const policies = getCedarPolicies(cedarPath);

  const ENTITIES_FILE = path.resolve(cedarPath, 'cedarentities.json');
  const entitiesJson: string = fs.readFileSync(ENTITIES_FILE, 'utf-8');
  const entities: Array<EntityJson> = JSON.parse(entitiesJson);

  return {
    schema: schema,
    policies: policies,
    entities: entities,
  };
};
