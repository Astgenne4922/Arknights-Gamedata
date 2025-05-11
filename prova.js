import fs from "fs";

const regex = /\[(\w*)(?:\(.*\)|=".*"|)\]/gm;
const commands = [];
try {
    const dir = await fs.promises.opendir("./stories");
    for await (const dirent of dir) {
        if (dirent.isDirectory()) {
            const story = await fs.promises.opendir(`./stories/${dirent.name}/scripts`);
            console.log(`./stories/${dirent.name}/scripts`);
            for await (const file of story) {
                const str = fs.readFileSync(`./stories/${dirent.name}/scripts/${file.name}`);
                let m;

                while ((m = regex.exec(str)) !== null) {
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }

                    m.slice(1).forEach((match, groupIndex) => {
                        if (!commands.includes(match.toLowerCase()))
                            commands.push(match.toLowerCase());
                    });
                }
            }
        }
    }

    fs.writeFileSync("./commands.json", JSON.stringify(commands, null, 4));
} catch (err) {
    console.error(err);
}
