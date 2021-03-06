'use strict';

// const findit = require('findit2');
const debug = require('debug')('fun:install');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const { installPackage, installFromYaml } = require('../install/install');
const { FunModule, FunTask } = require('../install/module');


async function installAll({recursive, verbose}) {
  const cd = process.cwd();
  const ymlPath = path.join(cd, 'fun.yml');

  if (!recursive) {
    if (fs.existsSync(ymlPath)) {
      installFromYaml(ymlPath, verbose);
    } else {
      console.error('Can\'t find \'fun.yml\' in current dir.');
      return;
    }
  } else {
    //TODO
    console.error('option `--recurive` is unsupported now.');
    return;
    // const finder = findit(cd, { followSymlinks: 'true' });

    // finder.on('directory', function (dir, stat, stop, linkPath) {

    // });
  }

}

function getRuntime(options) {
  if (options.runtime) {
    return options.runtime;
  }

  if (fs.existsSync('./fun.yml')) {
    const funModule = FunModule.load('./fun.yml');
    if (funModule.runtime) {
      return funModule.runtime;
    } 
    throw new Error('fun.yml missing \'runtime\' properties.');
    
  } else {
    throw new Error('\'runtime\' is missing, you can specify it by --runtime options or create a fun.yml with \'runtime\' properties.');
  }

}

async function save(runtime, codeUri, pkgType, packages){
  const ymlPath = path.join(codeUri, 'fun.yml');

  var funModule;
  if (fs.existsSync(ymlPath)) {
    funModule = FunModule.load(ymlPath);
  } else {
    funModule = new FunModule(runtime);
  }

  for (const pkg of packages) {
    switch (pkgType) {
    case 'pip':
      funModule.addTask(new FunTask('pip', {
        pip: pkg,
        local: true
      }));
      break;
    case 'apt':
      funModule.addTask(new FunTask('apt', {
        apt: pkg,
        local: true
      }));
      break;
    default:
      console.error('unknown task %s => %s', pkgType, pkg);
    }
  }

  FunModule.store(ymlPath, funModule);
  debug(`save to ${ymlPath}`);

}

async function install(packages, options) {
  const runtime = getRuntime(options);
  debug(`runtime: ${runtime}`);
  const pkgType = options.packageType;
  debug(`packageType: ${pkgType}`);

  for (const pkg of packages) {
    await installPackage(runtime, pkgType, pkg, options);
  }

  if (options.save) {
    await save(runtime, options.codeUri, pkgType, packages);
  }
}





async function init() {
  const answers = await inquirer.prompt([{
    type: 'list',
    message: 'Select runtime',
    name: 'runtime',
    choices: ['python2.7', 'python3', 'nodejs6', 'nodejs8', 'java8', 'php7.2']
  }]);

  const funModule = new FunModule(answers.runtime);

  FunModule.store('./fun.yml', funModule);
}

module.exports = {
  install,
  installAll,
  init,
};