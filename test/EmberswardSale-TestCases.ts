import { expect } from "chai";

export function embSalev1testCases(): void {
  it("should check sell property", async function () {
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    await this.nftInstance.approve(this.saleInstance.address, 1);
    await this.saleInstance.sellProperty(1, 10000);

    const checkResult = await this.nftInstance.balanceOf(this.accounts[0].address);
    expect(checkResult.toString()).to.be.equal("0");
  });

  it("should throw error bc of approvement", async function () {
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    // await expect(this.saleInstance.sellProperty(1, 10000)).to.be.reverted;
  });

  it("should cancel sale correctly", async function () {
    const ADMIN_hash = await this.saleInstance.ADMIN();
    await this.saleInstance.grantRole(ADMIN_hash, this.accounts[0].address);
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    await this.nftInstance.approve(this.saleInstance.address, 1);
    await this.saleInstance.sellProperty(1, 10000);

    const balBef = await this.nftInstance.balanceOf(this.accounts[0].address);
    await this.saleInstance.cancelSale(1);
    const balAft = await this.nftInstance.balanceOf(this.accounts[0].address);

    await expect(Number(balBef.toString()) + 1).to.be.equal(Number(balAft.toString()));
  });

  it("should throw error because of user ownership", async function () {
    const ADMIN_hash = await this.saleInstance.ADMIN();
    await this.saleInstance.grantRole(ADMIN_hash, this.accounts[0].address);
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    await this.nftInstance.approve(this.saleInstance.address, 1);
    await this.saleInstance.sellProperty(1, 10000);
    const newContractWithSigner1 = await this.saleInstance.connect(this.accounts[1]);

    await expect(newContractWithSigner1.cancelSale(1, { from: this.accounts[1].address })).to.be.reverted;
  });

  it("should purchase property correctly", async function () {
    const ADMIN_hash = await this.saleInstance.ADMIN();
    await this.saleInstance.grantRole(ADMIN_hash, this.accounts[0].address);
    await this.saleInstance.grantRole(ADMIN_hash, this.accounts[1].address);
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    await this.nftInstance.approve(this.saleInstance.address, 1);
    await this.saleInstance.sellProperty(1, 1);
    await this.tokenInstance.transfer(this.accounts[1].address, "50");

    const SaleContractWithSigner1 = await this.saleInstance.connect(this.accounts[1]);
    const TokenContractWithSigner1 = await this.tokenInstance.connect(this.accounts[1]);

    await TokenContractWithSigner1.approve(this.saleInstance.address, "50", { from: this.accounts[1].address });

    const balBef = await this.nftInstance.balanceOf(this.accounts[1].address);
    await SaleContractWithSigner1.purchaseProperty(1, this.accounts[1].address, { from: this.accounts[1].address });
    const balAft = await this.nftInstance.balanceOf(this.accounts[1].address);

    expect(Number(balBef.toString()) + 1).to.be.equal(Number(balAft.toString()));
  });

  it("should throw error because of allowance", async function () {
    const ADMIN_hash = await this.saleInstance.ADMIN();
    await this.saleInstance.grantRole(ADMIN_hash, this.accounts[0].address);
    await this.saleInstance.grantRole(ADMIN_hash, this.accounts[1].address);
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    await this.nftInstance.approve(this.saleInstance.address, 1);
    await this.saleInstance.sellProperty(1, 1);

    const SaleContractWithSigner1 = await this.saleInstance.connect(this.accounts[1]);

    await expect(
      SaleContractWithSigner1.purchaseProperty(1, this.accounts[1].address, { from: this.accounts[1].address }),
    ).to.be.reverted;
  });

  it("should purchase a parcel", async function () {
    const ADMIN_hash = await this.saleInstance.ADMIN();
    await this.saleInstance.grantRole(ADMIN_hash, this.accounts[0].address);
    await this.saleInstance.grantRole(ADMIN_hash, this.accounts[1].address);
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    await this.nftInstance.approve(this.saleInstance.address, 1);
    await this.saleInstance.sellProperty(1, 1);
    await this.tokenInstance.transfer(this.accounts[1].address, "50");

    const SaleContractWithSigner1 = await this.saleInstance.connect(this.accounts[1]);
    const TokenContractWithSigner1 = await this.tokenInstance.connect(this.accounts[1]);

    await TokenContractWithSigner1.approve(this.saleInstance.address, "50", { from: this.accounts[1].address });

    const balBef = await this.nftInstance.balanceOf(this.accounts[1].address);
    await SaleContractWithSigner1.purchaseParcel([1], this.accounts[1].address, { from: this.accounts[1].address });
    const balAft = await this.nftInstance.balanceOf(this.accounts[1].address);

    expect(Number(balBef.toString()) + 1).to.be.equal(Number(balAft.toString()));
  });

  it("should get correct sale info", async function () {
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    await this.nftInstance.approve(this.saleInstance.address, 1);
    await this.saleInstance.sellProperty(1, 10000);

    let info = await this.saleInstance.getSale(1);
    expect(info[0]).to.be.equal(this.accounts[0].address);
  });

  it("should change trusted forwarder", async function () {
    await this.saleInstance.updateForwarder("0x2FDEeCa4925abCdE4912E2f87604577432B6bbc4", {
      from: this.accounts[0].address,
    });
    let resultAfter = await this.saleInstance.isTrustedForwarder("0x2FDEeCa4925abCdE4912E2f87604577432B6bbc4");
    expect(resultAfter).to.be.equal(true);
  });
}
