import { expect } from "chai";

export function embNFTv1testCases(): void {
  it("should check initialize function", async function () {
    expect(await this.nftInstance.symbol()).to.equal("LAND");
  });

  it("should change trustedForwarder", async function () {
    await this.nftInstance.updateForwarder("0x2FDEeCa4925abCdE4912E2f87604577432B6bbc4", {
      from: this.accounts[0].address,
    });
    const trustedForwarder = await this.nftInstance.isTrustedForwarder("0x2FDEeCa4925abCdE4912E2f87604577432B6bbc4");
    expect(trustedForwarder).to.equal(true);
  });

  it("should throw error because called by not DEFAULT_ADMIN_ROLE", async function () {
    const newContractWithSigner1 = await this.nftInstance.connect(this.accounts[1]);

    // Error "Invalid Chai property: reverted"
    await expect(
      newContractWithSigner1.updateForwarder("0xBc0B18e4673D1a9ee819f2293DB1B7697b3a69F4", {
        from: this.accounts[1].address,
      }),
    ).to.be.reverted;
  });

  it("should mint property correctly", async function () {
    const tokensAmountBef = await this.nftInstance.balanceOf(this.accounts[0].address);

    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");

    const tokensAmountAft = await this.nftInstance.balanceOf(this.accounts[0].address);
    expect(Number(tokensAmountBef.toString()) + 1).to.be.equal(Number(tokensAmountAft.toString()));
  });

  it("should throw error if not granted Minter role", async function () {
    // Error "Invalid Chai property: reverted"
    await expect(this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData")).to.be.reverted;
  });

  it("should throw error because of multiple creations on the same coordinates", async function () {
    const Minter_hash = await this.nftInstance.MINTER_ROLE(); // Receives token minter's role
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address); // Grants role first account
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData"); // Mints (creates) new NFT token

    await expect(this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "AnotherData")).to.be.reverted;
    // Throws error and we are catching it.                                                    ^^^^^^^^^^^^^^
  });

  it("should check function 'getTokenIdByCoordinates'", async function () {
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData");
    const checkValue = await this.nftInstance.getTokenIdByCoordinates(1, 1);
    expect(checkValue.toString()).to.be.equal("1");
  });

  it("should throw error when checking", async function () {
    await expect(this.nftInstance.getTokenIdByCoordinates(1, 1)).to.be.reverted;
  });

  it("should transfer a bunch of tokens", async function () {
    const Minter_hash = await this.nftInstance.MINTER_ROLE();
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.grantRole(Minter_hash, this.accounts[0].address);
    await this.nftInstance.mintProperty(this.accounts[0].address, 1, 1, "SomeData1");
    await this.nftInstance.mintProperty(this.accounts[0].address, 2, 2, "SomeData2");
    await this.nftInstance.mintProperty(this.accounts[0].address, 3, 3, "SomeData3");

    await this.nftInstance.approve(this.accounts[1].address, 1);
    await this.nftInstance.approve(this.accounts[1].address, 2);
    await this.nftInstance.approve(this.accounts[1].address, 3);

    await this.nftInstance.batchTransferFrom(this.accounts[0].address, this.accounts[1].address, [1, 2, 3]);
    const tokensAmountAft = await this.nftInstance.balanceOf(this.accounts[1].address);

    expect(tokensAmountAft.toString()).to.be.equal("3");
  });
}
