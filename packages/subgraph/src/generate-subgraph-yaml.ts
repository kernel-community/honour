import networkMapping from '../config/deployments.json';
import fs from 'fs';
import Mustache from 'mustache';

fs.readFile('./subgraph.yaml.mustache', async function(err, data) {

    const chainIds = Object.keys(networkMapping);

    for (const chainId of chainIds) {
        const networkMappingForChain = networkMapping[chainId as keyof typeof networkMapping];
        const networkName = networkMappingForChain[0]['name'];
        const HonourMapping = networkMappingForChain[0]['contracts']['Honour'];

        const out = Mustache.render(data.toString(), {
            network: networkName,
            honourAddress: HonourMapping.address,
        });

        fs.writeFileSync(
            `./subgraph.${networkName}.yaml`,
            out
        )  
    }

});