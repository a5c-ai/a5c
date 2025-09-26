---
name: "A5C Package Install"
about: Install a package
labels: [a5c-package-install]

# form:
- package:
  - type: text
    name: package
    label: Package
    required: true
    placeholder: Enter the package uri (e.g. github://a5c-ai/a5c/branch/main/registry/packages/development/)
    default: github://a5c-ai/a5c/branch/main/registry/packages/
---

## Summary

What package do you want to install?

Package: ${{ inputs.package }}