/**
 * @module
 * @hidden
 */
import { createLayerTreeNode, createResetButton } from "data/common";
import { createExponentialScaling } from "data/helpers";
import { main } from "data/projEntry";
import { createIndependentConversion } from "features/conversion";
import { Visibility, jsx, showIf } from "features/feature";
import { createReset } from "features/reset";
import { createResource, trackBest } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { render } from "util/vue";
import advancements from "../Advancements";
import MainDisplay from "features/resources/MainDisplay.vue";
import { computed, ComputedRef } from "vue";
import { format } from "util/bignum";
import flame from "../row1/Flame";
import lightning from "../row2/Lightning";
import aqua from "../row1/Aqua";
import earth from "../row2/Earth";
import {
    createMultiBuyable,
    MultiBuyable,
    MultiBuyableOptions
} from "data/customFeatures/multiBuyable";
import { Computable } from "util/computed";

const layer = createLayer("comb", () => {
    const id = "comb";
    const name = "Combinators";
    const color = "#03fca9";

    const combinators = createResource<DecimalSource>(0, "Particle Combinators");
    const best = trackBest(combinators);

    const mainEff = computed(() => {
        return Decimal.sqrt(combinators.value).plus(1);
    });

    const conversion = createIndependentConversion(() => ({
        scaling: createExponentialScaling(1e11, 4, 2),
        baseResource: main.particles,
        gainResource: combinators,
        roundUpCost: true
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        visibility: () =>
            advancements.milestones[15].earned.value ? Visibility.Visible : Visibility.Hidden,
        layerID: id,
        display: jsx(() => <img src="./nodes/combinators.png" />),
        color,
        reset,
        style: {
            transform: "scale(1.5)"
        },
        glowColor: () =>
            multiBuyables.some(bbl => bbl.canPurchase.value && Decimal.lt(bbl.amount.value, 1))
                ? "red"
                : ""
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(combinators),
        pinnable: true,
        style: () => (treeNode.visibility.value === Visibility.Visible ? "" : "display: none")
    });

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    const multiBuyableEffects: { [key: number]: ComputedRef<DecimalSource> } = {
        0: computed(() => {
            let eff = Decimal.add(flame.flame.value, 1)
                .log10()
                .times(multiBuyables[0].amount.value)
                .plus(1)
                .log10();
            if (advancements.milestones[17].earned.value) eff = eff.pow(3);
            return eff;
        }),
        1: computed(() =>
            Decimal.add(earth.earth.value, 1)
                .log10()
                .times(Decimal.pow(multiBuyables[1].amount.value, 1.5))
                .plus(1)
                .cbrt()
        )
    };

    const multiBuyables: MultiBuyable<
        MultiBuyableOptions & { visibility: Computable<Visibility> }
    >[] = [
        createMultiBuyable(() => ({
            visibility: () => showIf(Decimal.gte(best.value, 1)),
            costSets: [
                {
                    cost: 1e6,
                    resource: flame.flame
                },
                {
                    cost: 1e4,
                    resource: lightning.lightning
                }
            ],
            display: () => ({
                title: "Spark Molecule",
                description: "Increase Base Particle gain based on Flame Particles.",
                effectDisplay: "+" + format(multiBuyableEffects[0].value)
            })
        })),
        createMultiBuyable(() => ({
            visibility: () => showIf(Decimal.gte(best.value, 1)),
            costSets: [
                {
                    cost: 2.5e6,
                    resource: aqua.aqua
                },
                {
                    cost: 100,
                    resource: earth.earth
                }
            ],
            display: () => ({
                title: "Mud Molecule",
                description: "Multiply Particle & Aqua Particle gain based on Earth Particles.",
                effectDisplay: format(multiBuyableEffects[1].value) + "x"
            })
        }))
    ];

    return {
        id,
        name,
        color,
        combinators,
        best,
        multiBuyables,
        multiBuyableEffects,
        mainEff,
        display: jsx(() => {
            const combDisplay = multiBuyables.map(render);

            return (
                <>
                    <MainDisplay resource={combinators} color={color} />
                    {render(resetButton)} <br />
                    <br />
                    Multiplies Earth, Lightning, Air, and Cryo Particles by {format(mainEff.value)}.
                    <br />
                    <br />
                    {combDisplay}
                </>
            );
        }),
        treeNode
    };
});

export default layer;
