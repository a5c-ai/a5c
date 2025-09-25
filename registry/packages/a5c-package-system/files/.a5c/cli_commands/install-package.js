
// imported to cli

// called by the run-command cli command
// a5c run-command install-package -- github://owner/repo/ref/path

// inputs:
// - package uri: string (github://owner/repo/ref/path)

// parse args using yargs
import { Command } from "commander";
const program = new Command();
program
  .command("install-package")
  .description("Install a package")
  .argument("package", "github://owner/repo/ref/path")
  .action(async (cmdOpts) => {
    const packageUri = cmdOpts.package;
        const outputEvent = {
            type: "a5c_package_installer_request",
            payload: {
                original_event: {
                    type: "install_package",
                    payload: {
                        package: packageUri,
                    },
                },
                issue: {
                    html_url: "non-existing-issue",
                    number: 1,
                    closed: false,
                    labels: [],
                    body: "install a5c-package-system",
                },
            },
        }
        console.log(JSON.stringify(outputEvent));
    });


export default program;