'use strict';

require('../base.spec');

const Dashboard = require('../../dashboard');
let dashboard;
let dashboardWithOptions;
const options = { color: 'red', minimal: true, title: 'my-title' };

beforeEach(() => {
  dashboard = new Dashboard();
  dashboardWithOptions = new Dashboard(options);
});

describe('dashboard', () => {
  it('can create a new dashboard', () => {
    expect(dashboard).to.be.ok;
  });

  describe('#color', () => {
    it("has default color of 'green'", () => {
      expect(dashboard.color).to.equal('green');
    });

    context('when given option color red', () => {
      it("has color set to 'red'", () => {
        expect(dashboardWithOptions.color).to.equal('red');
      });
    });
  });

  describe('#minimal', () => {
    it("has default minimal set to 'false", () => {
      expect(dashboard.minimal).to.be.false;
    });

    context('when given opiton minimal', () => {
      it("has minimal set to 'true'", () => {
        expect(dashboardWithOptions.minimal).to.be.true;
      });
    });
  });

  it("has default stats of 'null'", () => {
    expect(dashboard.stats).to.be.null;
  });
});
