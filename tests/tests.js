((root) => {

    'use strict';

    let resultsEl = document.getElementById('results');

    function test(desc, func) {
        try {
            func();
            resultsEl.innerHTML += `<div class="success">SUCCESS: ${desc}</div>`;
        } catch (err) {
            resultsEl.innerHTML += `<div class="failed">FAILED: ${desc}<br />${err}</div>`;
        }
    }

    function assertTrue(isTrue) {
        if (!isTrue) {
            throw new Error("Got false when expecting true");
        }
    }

    function assertEquals(expected, given) {
        if (typeof expected !== typeof given) {
            throw new Error(`Type mismatch! Expected ${typeof expected}, got ${typeof given}`);
        }

        if (typeof expected == "object") {
            if (JSON.stringify(expected) !== JSON.stringify(given)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, Given ${JSON.stringify(given)}`);
            }
        } else if (expected !== given) {
            throw new Error(`Expected ${expected}, Given ${given}`);
        }
    }

    root.testSuite = function(methodsForTest) { return [
        function testParseEvsFromPasteReturnsEvObject() {
            test(
                "should contain evs",
                function() {
                    let evs = methodsForTest.parseEvsFromPaste(
                        "EVs: 236 HP / 4 Atk / 100 Def / 156 SpD / 12 Spe  "
                    );

                    assertEquals([
                        "hp",
                        "atk",
                        "def",
                        "spd",
                        "spe",
                        "spa",
                    ], Object.keys(evs));
                }
            );
        },

        function testParseEvsFromPasteGetsCorrectEvs() {
            test(
                "should contain correct evs",
                function() {
                    let evs = methodsForTest.parseEvsFromPaste(
                        "EVs: 236 HP / 4 Atk / 100 Def / 156 SpD / 12 Spe  "
                    );

                    assertEquals({
                        hp: 236,
                        atk: 4,
                        def: 100,
                        spd: 156,
                        spe: 12,
                        spa: 0,
                    }, evs);
                }
            );
        },

        function testParseEvsFromPasteThrowsIfNoEvsFound() {
            test(
                "should throw if no evs are found",
                function() {
                    let wasThrown = false;
                    try {
                        methodsForTest.parseEvsFromPaste(
                            "1224"
                        );
                    } catch (e) {
                        wasThrown = true;
                    }

                    assertTrue(wasThrown);
                }
            );
        },

        function testParseEvsFromPasteThrowsIfInvalidEvsFound() {
            test(
                "should throw if invalid evs are found",
                function() {
                    let wasThrown = false;
                    try {
                        methodsForTest.parseEvsFromPaste(
                            "EVs: 299 HP"
                        );
                    } catch (e) {
                        wasThrown = true;
                    }

                    assertTrue(wasThrown);
                }
            );
        },

        function testVerifyEvsReturnsNoErrorsOnSuccess() {
            test(
                "should not return any errors for valid evs",
                function() {
                    let errs = methodsForTest.verifyEvs({
                        hp: 4,
                        atk: 252,
                        def: 0,
                        spa: 0,
                        spd: 0,
                        spe: 252,
                    });

                    assertEquals(0, errs.wasted.length);
                    assertEquals(0, errs.total);
                }
            );
        },

        function testVerifyEvsReturnsWastedEvsAmountWasted() {
            test(
                "should not return any errors for valid evs",
                function() {
                    let errs = methodsForTest.verifyEvs({
                        hp: 8,
                        atk: 248,
                        def: 0,
                        spa: 0,
                        spd: 0,
                        spe: 248,
                    });

                    assertEquals(4, errs.total);

                    assertEquals([
                        { stat: 'hp', amount: 4 },
                        { stat: 'atk', amount: 4 },
                        { stat: 'spe', amount: 4 },
                    ], errs.wasted);
                }
            );
        },

        function testVerifyEvsReturnsEvOverageAsNegative() {
            test(
                "returns number of evs overage",
                function() {
                    let errs = methodsForTest.verifyEvs({
                        hp: 4,
                        atk: 252,
                        def: 0,
                        spa: 0,
                        spd: 0,
                        spe: 255,
                    });

                    assertEquals(-3, errs.total);
                }
            );
        },

        function testGetWastedEvsMsgReturnsExpectedMessageForTooManyEvs() {
            test(
                "returns expected string for too many evs",
                function() {
                    let message = methodsForTest.getWastedEvsMsg({
                        wasted: [{ stat: "hp", amount: 6 }],
                        total: -10,
                    });

                    assertEquals("Spread has 518 EVs (508 expected)", message);
                }
            );
        },

        function testGetWastedEvsMsgReturnsExpectedMessageForWastedEvs() {
            test(
                "returns expected string for wasted evs",
                function() {
                    let message = methodsForTest.getWastedEvsMsg({
                        wasted: [{ stat: "hp", amount: 6 }, { stat: "def", amount: 2 }],
                        total: 0,
                    });

                    assertEquals("Wasted EVs: HP 6 / Def 2", message);
                }
            );
        },

        function testCalcEvDifferenceReturnsCorrectEvDifference() {
            test(
                "correctly calculates ev difference",
                function() {
                    let diff = methodsForTest.calcEvDifference(
                        // these are not real spreads
                        { hp: 100, atk: 4, def: 12, spd: 156, spe: 0 },
                        { hp: 108, def: 0, spa: 252, spd: 168 }
                    );

                    assertEquals({
                        hp: 8,
                        atk: -4,
                        def: -12,
                        spa: 252,
                        spd: 12,
                        spe: 0,
                    }, diff);
                }
            );
        },

        function testEvsToStringCorrectlyConvertsEvsToString() {
            test(
                "returns expected string from evs object",
                function() {
                    let str = methodsForTest.evsToString({
                        hp: 100,
                        atk: 4,
                        def: 156,
                        spaa: 999, // should not be included
                        spd: 100,
                        spe: 4,
                    }, true);

                    assertEquals(str, "HP +100 / Atk +4 / Def +156 / SpD +100 / Spe +4");
                }
            );
        },

        function testCalcItemsNeededForSpreadChangeReturnsExpectedItems() {
            test(
                "returns expected items needed for ev spread change",
                function() {
                    let items = methodsForTest.calcItemsNeededForSpreadChange(
                        { hp: -248, atk: -252, def: 252, spa: 252, spd: -4, spe: 0 },
                        { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
                        { hp: 4, atk: 0, def: 252, spa: 252, spd: 0, spe: 0 }
                    );

                    assertEquals({
                        hp: { berries: 25, vitamins: 0, feathers: 2 },
                        atk: { berries: 26, vitamins: 0, feathers: 0 },
                        def: { berries: 0, vitamins: 25, feathers: 2 },
                        spa: { berries: 0, vitamins: 25, feathers: 2 },
                        spd: { berries: 1, vitamins: 0, feathers: 0 }
                    }, items);
                }
            );
        },

        function testGetItemsToDisplayReturnsNiceItemList() {
            test(
                "returns expected list of items to display",
                function() {
                    let items = methodsForTest.getItemsToDisplay({
                        hp: { berries: 25, vitamins: 0, feathers: 2 },
                        atk: { berries: 26, vitamins: 0, feathers: 0 },
                        def: { berries: 0, vitamins: 25, feathers: 2 },
                        spa: { berries: 0, vitamins: 25, feathers: 2 },
                        spd: { berries: 1, vitamins: 0, feathers: 0 }
                    });

                    assertEquals(3, items.berries.length);
                    assertEquals("pomeg", items.berries[0].code);
                    assertEquals("kelpsy", items.berries[1].code);
                    assertEquals("grepa", items.berries[2].code);

                    assertEquals(2, items.vitamins.length);
                    assertEquals("iron", items.vitamins[0].code);
                    assertEquals("calcium", items.vitamins[1].code);

                    assertEquals(3, items.feathers.length);
                    assertEquals("health", items.feathers[0].code);
                    assertEquals("resist", items.feathers[1].code);
                    assertEquals("genius", items.feathers[2].code);
                }
            );
        },

    ]; };
})(this);
