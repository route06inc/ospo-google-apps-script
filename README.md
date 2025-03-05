# OSPO Google Apps Script by ROUTE06, Inc.

## TODO

### Replace strings in files

Please replace the specified locations in the following files, for example `[REPO NAME]`:

* [x] .github/ISSUE_TEMPLATE/config.yml
* [x] CODE_OF_CONDUCT.md
* [x] CODE_OF_CONDUCT_ja.md
    * Remove it if you don't need it
* [x] CONTRIBUTING.md
* [x] README.md
* [x] SECURITY.md

### Choose LICENSE

* If you choose MIT License:
    * [ ] `$ mv LICENSE_MIT LICENSE && rm LICENSE_Apache-2.0`
    * [ ]  Replace `[year]` in `LICENSE` file
* Else if you choose Apache License 2.0:
    * [ ] `$ mv LICENSE_Apache-2.0 LICENSE && rm LICENSE_MIT`
    * [ ]  Replace `[year]` in `LICENSE` file
* Else:
    * [ ] Add `LICENSE` file you choose
        * ref. https://choosealicense.com/
    * [ ] `$ rm LICENSE_MIT LICENSE_Apache-2.0`
