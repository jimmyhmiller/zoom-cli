#!/usr/bin/env node --no-warnings

const program = require("commander");
const fs = require('fs').promises
const homedir = require('os').homedir();
const open = require("open");
const clipboardy = require("clipboardy")

const infoFile = `${homedir}/.zoom-cli.json`

const fileExists = async (path) => {
  try {
    await fs.stat(path)
    return true
  } catch (e) {
    return false
  }
}

const writeSettings = async (path, settings) => {
  const handler = await fs.open(infoFile, 'w+')
  await handler.write(JSON.stringify(settings))
  handler.close()
}

const readSettings = async (path) => {
  try {
    const handler = await fs.open(infoFile, 'r+')
    const content = await handler.readFile()
    handler.close()
    return JSON.parse(content);
  } catch (e) {
    return {}
  }
}

// Hack to stop it from trying to find sub exec
program.executeSubCommand = () => false;
// Hack subcommands don't have their own help. They are too simple
program.addImplicitHelpCommand = () => {};


program
  .version('1.1.0')
  .command('add <name> <url>','Add a zoom channel to known list')
  .command('join <name>', 'join zoom channel')
  .command('copy <name>', 'copy zoom link to clipboard')
  .command('list', 'list all known zoom channels')


program.on("command:add", async ([name, url]) => {
  const settings = await readSettings(infoFile);
  const newSettings = {
    ...settings,
    aliases: {
      ...settings.aliases,
      [name]: url
    }
  }
  await writeSettings(infoFile, newSettings);
  console.log(`Added ${name}.`)
})

program.on("command:join", async ([name]) => {
  const settings = await readSettings(infoFile);
  const url = settings.aliases[name];
  open(url);
})

program.on("command:copy", async ([name]) => {
  const settings = await readSettings(infoFile);
  const url = settings.aliases[name];
  await clipboardy.write(url);
  console.log(`${url} copied to clipboard`)
})

program.on("command:list", async () => {
   const settings = await readSettings(infoFile);
   Object.keys(settings.aliases).forEach(name => {
    console.log(`${name}: ${settings.aliases[name]}`)
   })
})

program.parse(process.argv);

