# FHIR for Nuxt
Build FHIR applications rapidly with Nuxt

## ✅ Status

Currently under development (WIP).

## FHIR Server

nhealth is designed to work with various FHIR servers. Currently, it supports Hapi and Medplum.

## Overview

This repository provides a framework for building FHIR applications using Nuxt. It includes several packages and modules to facilitate the development of FHIR-compliant applications. The key components are:

- **packages/auth**: Manages authentication and session handling.
- **packages/profiling**: Offers tools for profiling and managing FHIR resources.
- **packages/app**: The main application layer that integrates the other packages.
- **playground/profiling**: A sample project demonstrating profiling capabilities.
- **packages/questionaire**: Questionaire builder and viewer for FHIR applications. [WIP]
- **playground/demo**: A demo project showcasing the framework's usage.

Each package and project is designed to work together, providing a comprehensive solution for building FHIR applications with Nuxt.

## TODO
- Explore Google FHIR Gateway as an alternative for authentication: see [repo](https://github.com/google/fhir-gateway) or [docs](https://google.github.io/fhir-gateway/)
