"use strict";

const chalk = require("chalk");
const blessed = require("neo-blessed");

const base = require("../base.spec");
const Dashboard = require("../../dashboard");

const mockSetItems = () => {
  // Override ListBar fakes from what we do in `base.spec.js`.
  // Note that these are **already** stubbed. We're not monkey-patching blessed.
  blessed.listbar.returns({
    selected: "selected",
    setLabel: base.sandbox.spy(),
    selectTab: base.sandbox.spy(),
    setItems: base.sandbox.stub().callsFake(obj => {
      // Naively simulate what setItems would do calling each object key.
      Object.keys(obj).forEach(key => obj[key]());
    })
  });
};

describe("dashboard", () => {
  const options = {
    color: "red",
    minimal: true,
    title: "my-title"
  };

  it("can create a new no option dashboard", () => {
    const dashboard = new Dashboard();
    expect(dashboard).to.be.ok;
    expect(dashboard.color).to.equal("green");
    expect(dashboard.minimal).to.be.false;
    expect(dashboard.stats).to.be.null;
  });

  it("can create a new with options dashboard", () => {
    const dashboardWithOptions = new Dashboard(options);
    expect(dashboardWithOptions).to.be.ok;
    expect(dashboardWithOptions.color).to.equal("red");
    expect(dashboardWithOptions.minimal).to.be.true;
  });

  describe("set* methods", () => {
    let dashboard;

    beforeEach(() => {
      dashboard = new Dashboard();
    });

    describe("setData", () => {
      const dataArray = [
        {
          type: "progress",
          value: 0.57
        },
        {
          type: "operations",
          value: "IDLE"
        }
      ];

      it("can setData", () => {
        expect(() => dashboard.setData(dataArray)).to.not.throw;
      });
    });

    describe("setOperations", () => {
      const data = {
        value: "IDLE"
      };

      it("can setOperations", () => {
        expect(() => dashboard.setOperations(data)).to.not.throw;

        dashboard.setOperations(data);
        expect(dashboard.operations.setContent).to.have.been.calledWith(data.value);
      });
    });

    describe("setStatus", () => {
      const data = {
        value: "Success"
      };

      it("can setStatus", () => {
        expect(() => dashboard.setStatus(data)).to.not.throw;

        dashboard.setStatus(data);
        expect(dashboard.status.setContent).to.have.been.calledWith(
          `{green-fg}{bold}${data.value}{/}`
        );
      });

      it("should display a failed status on build failure", () => {
        data.value = "Failed";
        expect(() => dashboard.setStatus(data)).to.not.throw;

        dashboard.setStatus(data);
        expect(dashboard.status.setContent).to.have.been.calledWith(
          `{red-fg}{bold}${data.value}{/}`
        );
      });

      it("should display any other status string without coloring", () => {
        data.value = "Unknown";
        expect(() => dashboard.setStatus(data)).to.not.throw;

        dashboard.setStatus(data);
        expect(dashboard.status.setContent).to.have.been.calledWith(`{bold}${data.value}{/}`);
      });
    });

    describe("setProgress", () => {
      const data = {
        value: 0.57
      };

      it("can setProgress", () => {
        expect(() => dashboard.setProgress(data)).to.not.throw;

        dashboard.setProgress(data);
        expect(dashboard.progressbar.setProgress).to.have.been.calledOnce;
        expect(dashboard.progressbar.setContent).to.have.been.called;
      });

      it(`should call progressbar.setProgress twice if not in minimal mode
      and percent is falsy`, () => {
        data.value = null;
        expect(() => dashboard.setProgress(data)).to.not.throw;

        dashboard.setProgress(data);
        expect(dashboard.progressbar.setProgress).to.have.been.calledTwice;
      });
    });

    describe("setStats", () => {
      const data = {
        value: {
          errors: null,
          data: {
            errors: [],
            warnings: []
          }
        }
      };

      it("can setStats", () => {
        expect(() => dashboard.setStats(data)).not.to.throw;

        dashboard.setStats(data);
        expect(dashboard.logText.log).to.have.been.called;
        expect(dashboard.modulesMenu.setLabel).to.have.been.calledWith(
          chalk.yellow("Modules (loading...)")
        );
        expect(dashboard.assets.setLabel).to.have.been.calledWith(
          chalk.yellow("Assets (loading...)")
        );
        expect(dashboard.problemsMenu.setLabel).to.have.been.calledWith(
          chalk.yellow("Problems (loading...)")
        );
      });

      it("should display stats errors if present", () => {
        data.value.errors = ["error"];
        expect(() => dashboard.setStats(data)).not.to.throw;

        dashboard.setStats(data);
        expect(dashboard.status.setContent).to.have.been.calledWith("{red-fg}{bold}Failed{/}");
      });
    });

    describe("setSizes", () => {
      const data = {
        value: {
          assets: {
            foo: {
              meta: {
                full: 456
              },
              files: [
                {
                  size: {
                    full: 123
                  },
                  fileName: "test.js",
                  baseName: "/home/bar/test.js"
                }
              ]
            },
            bar: {
              meta: {
                full: 123
              },
              files: []
            }
          }
        }
      };

      it("can setSizes", () => {
        const formattedData = [
          ["Name", "Size"],
          ["foo", "456 B"],
          ["bar", "123 B"],
          ["Total", "579 B"]
        ];

        expect(() => dashboard.setSizes(data)).to.not.throw;

        dashboard.setSizes(data);
        expect(dashboard.assets.setLabel).to.have.been.calledWith("Assets");
        expect(dashboard.assetTable.setData).to.have.been.calledWith(formattedData);
        expect(dashboard.modulesMenu.setLabel).to.have.been.calledWith("Modules");
        expect(dashboard.modulesMenu.setItems).to.have.been.called;
        expect(dashboard.modulesMenu.selectTab).to.have.been.calledWith(
          dashboard.modulesMenu.selected
        );
        expect(dashboard.screen.render).to.have.been.called;
      });

      it("should call formatModules", () => {
        // Mock out the call to setItems to force call of formatModules.
        mockSetItems();
        // Discard generic dashboard, create a new one with adjusted mocks.
        dashboard = new Dashboard();
        expect(() => dashboard.setSizes(data)).to.not.throw;
      });
    });

    describe("setSizesError", () => {
      const err = "error";

      it("can setSizesError", () => {
        expect(() => dashboard.setSizesError(err)).to.not.throw;

        dashboard.setSizesError(err);
        expect(dashboard.modulesMenu.setLabel).to.have.been.calledWith(
          chalk.red("Modules (error)")
        );
        expect(dashboard.assets.setLabel).to.have.been.calledWith(chalk.red("Assets (error)"));
        expect(dashboard.logText.log).to.have.been.calledWith(
          chalk.red("Could not load module/asset sizes.")
        );
        expect(dashboard.logText.log).to.have.been.calledWith(chalk.red(err));
      });
    });

    describe("setProblems", () => {
      const data = {
        value: {
          duplicates: {
            assets: {
              foo: "foo",
              bar: "bar"
            }
          },
          versions: {
            assets: {
              foo: "1.2.3",
              bar: "3.2.1"
            }
          }
        }
      };

      it("can setProblems", () => {
        expect(() => dashboard.setProblems(data)).to.not.throw;

        dashboard.setProblems(data);
        expect(dashboard.problemsMenu.setLabel).to.have.been.calledWith("Problems");
        expect(dashboard.problemsMenu.setItems).to.have.been.called;
        expect(dashboard.problemsMenu.selectTab).to.have.been.calledWith(
          dashboard.problemsMenu.selected
        );
        expect(dashboard.screen.render).to.have.been.called;
      });

      it("should call formatProblems", () => {
        // Mock out the call to setItems to force call of formatProblems.
        mockSetItems();
        // Discard generic dashboard, create a new one with adjusted mocks.

        dashboard = new Dashboard();
        expect(() => dashboard.setProblems(data)).to.not.throw;
      });
    });

    describe("setProblemsError", () => {
      const err = { stack: "stack" };

      it("can setProblemsError", () => {
        expect(() => dashboard.setProblemsError(err)).to.not.throw;

        dashboard.setProblemsError(err);
        expect(dashboard.problemsMenu.setLabel).to.have.been.calledWith(
          chalk.red("Problems (error)")
        );
        expect(dashboard.logText.log).to.have.been.calledWith(
          chalk.red("Could not analyze bundle problems.")
        );
        expect(dashboard.logText.log).to.have.been.calledWith(chalk.red(err.stack));
      });
    });

    describe("setLog", () => {
      const data = { value: "[{ log: 'log' }]" };

      it("can setLog", () => {
        expect(() => dashboard.setLog(data)).not.to.throw;

        dashboard.setLog(data);
        expect(dashboard.logText.log).to.have.been.calledWith("[ log: 'log' ]");
      });

      it("should return early if the stats object has errors", () => {
        dashboard.stats = {};
        dashboard.stats.hasErrors = () => true;
        expect(dashboard.setLog(data)).to.be.undefined;

        dashboard.setLog(data);
        expect(dashboard.logText.log).to.not.have.been.called;
      });
    });
  });
});
