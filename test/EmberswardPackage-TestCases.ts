import { expect } from "chai";

export function embSalev1testCases(): void {
  it("should change trusted forwarder", async function () {
    await this.packageInstance.updateForwarder("0x2FDEeCa4925abCdE4912E2f87604577432B6bbc4", {
      from: this.accounts[0].address,
    });
    let check = await this.packageInstance.isTrustedForwarder("0x2FDEeCa4925abCdE4912E2f87604577432B6bbc4");
    expect(check).to.be.equal(true);
  });

  it("should add new package", async function () {
    await expect(this.packageInstance.addPackage("Some Pack", "Some Desc")).to.not.be.reverted;
  });

  it("should mint new token to existing package", async function () {
    const Minter_hash = await this.packageInstance.MINTER_ROLE();
    await this.packageInstance.grantRole(Minter_hash, this.accounts[0].address);

    await this.packageInstance.addPackage("Some Pack", "Some Desc");
    await this.packageInstance.mintToken(1, this.accounts[0].address, 5);
    let balanceAfter = await this.packageInstance.balanceOf(this.accounts[0].address, 1);
    expect(balanceAfter.toString()).to.be.equal("5");
  });

  it("should throw error - isValid", async function () {
    const Minter_hash = await this.packageInstance.MINTER_ROLE();
    await this.packageInstance.grantRole(Minter_hash, this.accounts[0].address);

    await expect(this.packageInstance.mintToken(1, this.accounts[0].address, 1)).to.be.reverted;
  });

  it("should change URI correctly", async function () {
    await this.packageInstance.setURI("https://example.com");
    let newURI = await this.packageInstance.uri(1);
    expect(newURI).to.be.equal("https://example.com");
  });
}
