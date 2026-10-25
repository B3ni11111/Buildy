> Purpose: plain-language description of the Buildy app as it is today, as background for the NotebookLM payments podcast.

# Buildy: what the app is today

## In one sentence

Buildy is a web app for the residents of an apartment building. It gives the building one place for its issues, documents, members and contacts, in six languages: English, Hebrew, Arabic, Russian, French and Spanish. Hebrew and Arabic use right-to-left layouts.

## Who uses it

- **Resident:** an owner or renter. Reports issues, uploads documents, sees the building's members and their own apartments, edits their own profile.
- **Committee head (ראש ועד הבית) and management company (חברת ניהול):** same level of power, per building. They add residents, set apartments, change the status of issues, edit building details, and can remove or block residents.
- **Admin:** a global super user who can do everything in every building, from an admin console. This is for the app's owner, not for buildings.
- A person can belong to several buildings, with a different role in each. For example, owner in one, renter in another, committee head in a third.

## How someone gets into a building

Nobody can join a building by themselves. A new user signs in with Google, sets up their profile, and then sees their personal ID. They send that ID to the committee head or management company, who adds them to the building and sets their apartment. Anyone can create a building and become its committee head or management company. An empty building harms nobody.

## What a resident sees on the home screen

The home screen is a grid of tiles that each person can rearrange and customise:

- **Building:** address, description, door code, contact links (WhatsApp group, phone, email).
- **My apartments:** the person's apartments in this building, set by management.
- **Members:** pictures and names, building management first. Management also sees phone numbers and can manage each member.
- **Issues:** residents report problems with pictures or files. Management accepts or denies, then marks resolved. Every status change needs a note, and the history is kept.
- **Documents:** anyone can upload PDFs, Word, Excel, PowerPoint, images and text files, and open a preview in the app.

## How the data is organised

- A **building** has apartments. Each apartment has a number, floor and size. An apartment can have an owner and a renter, and one person can hold several apartments.
- Apartments currently have placeholder fields for a monthly fee and a payment method. Nothing sets the fee and nothing tracks payments. We agreed to ignore these and design payments from scratch.
- Roles are stored per building.
- There is **no audit log** yet. The first version of the app deliberately left out monthly fees, payment tracking and an audit log. Payments is the planned next iteration.

## How it is built (short)

- Login is handled by Google through AWS Cognito.
- The front end is a React web app. The back end is a NestJS server with a PostgreSQL database.
- Uploaded files are stored on the server's disk with generated names.
- The app is run locally with Docker. The back end is not deployed anywhere yet. The front end is deployed to AWS Amplify on a `staging` branch. Nothing is pushed to production directly.

## Why this matters for payments

- **Roles already exist,** so "only the committee head records payments" fits the current permissions.
- **Apartments already exist,** with floor and size. The fee calculator only needs two new things: a number of people per apartment, and parking or storage if a building wants it.
- **The document system already exists,** which can later hold generated receipts. Hebrew PDF output still needs to be built and tested.
- **Hebrew and right-to-left layouts already work,** but the app has six languages, while payment documents will be Hebrew only.
- **Privacy rules already exist:** residents see neighbours' names and apartments, while phone numbers and payment details are for management only. Payments must keep to that.
- **The app has never held financial records before.** That is why payments need an audit log, cancellations instead of deletions, and a legal check first.
