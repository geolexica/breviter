#!/usr/bin/env ts-node

import '@tensorflow/tfjs-node';
import {savePrecomputedDB} from '../lib/server';

savePrecomputedDB();
