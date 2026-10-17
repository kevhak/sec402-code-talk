# PhotoApp Authorization Requirements (EARS)

Requirements for a photo-sharing application's authorization system, written
using the [Easy Approach to Requirements Syntax (EARS)](https://alistairmavin.com/ears/).

> The Easy Approach to Requirements Syntax (EARS) is a mechanism to gently
> constrain textual requirements. The EARS patterns provide structured guidance
> that enable authors to write high quality textual requirements.

This document is the authoritative source of requirements for the system. It
describes _what_ the system must allow and deny, in plain language, without
assuming any particular policy language or implementation. It is intended to be
readable on its own and detailed enough to be translated into an authorization
model (entities, actions, attributes) and a set of authorization policies.

## The application

Users organize their photos into albums and share them with groups of users.
Users can view, edit, and delete photos. Access to a photo depends on who the
user is, which groups or roles they belong to, who owns the photo, which album
the photo is in, how the photo is labeled, and the circumstances of the request.

## EARS patterns used

| Pattern           | Template                                                         | Used for                                                 |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Ubiquitous        | THE SYSTEM SHALL `<response>`                                    | Feature / structural requirements                        |
| Event-driven      | WHEN `<trigger>`, THE SYSTEM SHALL `<response>`                  | Access granted on a request                              |
| State-driven      | WHILE `<state>`, THE SYSTEM SHALL `<response>`                   | Access that depends on a standing condition              |
| Unwanted behavior | IF `<condition>`, THEN THE SYSTEM SHALL `<response>`             | Access that must be denied                               |
| Optional feature  | WHERE `<feature>`, THE SYSTEM SHALL `<response>`                 | Behavior that applies only when optional data is present |
| Complex           | WHILE `<state>`, WHEN `<trigger>`, THE SYSTEM SHALL `<response>` | Access conditioned on both a state and a request         |

## Conventions

- Requirements use **SHALL** only. Vague operators (should, can, will) are not used.
- Each requirement states **one behavior** so that it can be traced to a single
  decision and verified independently.
- An "access" requirement describes a single authorization decision — allow or
  deny — for one user, one action, and one photo.
- Unless a requirement grants access, access is denied. The system is deny by
  default.

---

## 1. Feature requirements (Ubiquitous)

These describe the data the system must model and the actions it must support.

- **FR-1:** THE SYSTEM SHALL identify every actor as a user.
- **FR-2:** THE SYSTEM SHALL allow a user to belong to one or more user groups.
- **FR-3:** THE SYSTEM SHALL allow a user to be assigned one or more roles.
- **FR-4:** THE SYSTEM SHALL organize photos into albums.
- **FR-5:** THE SYSTEM SHALL support three actions on a photo: view, edit, and delete.
- **FR-6:** THE SYSTEM SHALL record exactly one owning user for every photo.
- **FR-7:** THE SYSTEM SHALL record a set of text labels for every photo.
- **FR-8:** THE SYSTEM SHALL allow a photo to optionally list one or more users as its subjects.
- **FR-9:** THE SYSTEM SHALL allow a view request to optionally indicate that it is being made during a judging session.
- **FR-10:** THE SYSTEM SHALL deny any request that no requirement explicitly allows.

---

## 2. Authorization requirements

### 2.1 Owner access

- **AR-1:** WHEN a user requests to view a photo they own, THE SYSTEM SHALL allow the request.
- **AR-2:** WHEN a user requests to edit a photo they own, THE SYSTEM SHALL allow the request.
- **AR-3:** WHEN a user requests to delete a photo they own, THE SYSTEM SHALL allow the request.

### 2.2 Group access to a shared album

- **AR-4:** WHILE a user is a member of a user group that has been granted view access to an album, WHEN that user requests to view a photo in that album, THE SYSTEM SHALL allow the request.

### 2.3 Individual access to a shared album

- **AR-5:** WHILE a user has been granted view access to an album, WHEN that user requests to view a photo in that album, THE SYSTEM SHALL allow the request.

### 2.4 Protection of private photos

- **AR-6:** WHILE a photo is labeled private, IF a user who is not its owner requests any action on that photo, THEN THE SYSTEM SHALL deny the request.

### 2.5 Contest judging

- **AR-7:** WHILE a user holds the photo-judge role and the request is made during a judging session, WHEN that user requests to view a photo labeled as a contest entry, THE SYSTEM SHALL allow the request.

### 2.6 Access for photo subjects

- **AR-8:** WHERE a photo lists a user among its subjects, WHEN that user requests to view the photo, THE SYSTEM SHALL allow the request.

---

## Notes on precedence

- A denial for an unwanted behavior (AR-6) takes precedence over any grant. For
  example, even if a user would otherwise be allowed to view a photo through an
  album, group, or subject grant, the private-photo protection still denies
  access to anyone but the owner.
- Grants are additive: a user may gain access through any one of the applicable
  grant requirements (ownership, album, group, role, or subject).
