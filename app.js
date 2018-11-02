const express = require('express');
const Docker = require('dockerode');
const config = require('./config.json');

const docker = new Docker({ socketPath: process.env.DOCKER_SOCK || '/var/run/docker.sock' });//uses manager host node socket

const app = express();

const hooks = config.hooks;

async function pullLatestImage(imageName) {
  return new Promise((resolve, reject) => {
    docker.pull(imageName, (error) => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  })
}

async function updateService(serviceName) {
  const services = await docker.listServices();
  const toUpdate = services.find(service => service.Spec.Name === serviceName);
  if (toUpdate) {
    const toUpdateId = toUpdate.ID;
    await docker.getService(toUpdateId).update(Object.assign(toUpdate.Spec, {
      version: toUpdate.Version.Index,
      force: true
    }));
  } else {
    throw new Error('Could not find service ' + serviceName)
  }
}

for (let hook of hooks) {
  app.post(hook.url, async (req, res) => {
    try {
      console.log(JSON.stringify({ image: hook.image, time: new Date() }));
      await pullLatestImage(hook.image);
      console.log(JSON.stringify({ service: hook.service, time: new Date() }));
      await updateService(hook.service);
      res.json({
        success: true
      })
    } catch (err) {
      console.log('Failed', err);
      res.status(500).json({
        error: err.message
      });
    }
  })
}

app.listen(process.env.PORT || 3000, () => {
  console.log(JSON.stringify({ listening: process.env.PORT || 3000, routes: hooks.map(h => h.url) }))
});
