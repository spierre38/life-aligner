const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/Barnes Building/Documents/life-aligner/app/components/OnboardingJourney.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the ANIM_STYLES constant (from "const ANIM_STYLES" through the closing backtick-semicolon)
content = content.replace(/\/\/ ── Animation CSS ─+\nconst ANIM_STYLES = `[\s\S]*?`;\n\n/m, '');

// 2. Remove the two <style dangerouslySetInnerHTML> lines
content = content.replace(/\s*<style dangerouslySetInnerHTML=\{\{ __html: ANIM_STYLES \}\} \/>/g, '');

// 3. Rename animation class names to obj- prefixed versions
content = content
    .replace(/\bblur-reveal\b/g, 'obj-blur-reveal')
    .replace(/\bslide-up\b/g, 'obj-slide-up')
    .replace(/\bfloat-plane\b/g, 'obj-float-plane')
    .replace(/\bfly-across\b/g, 'obj-fly-across')
    .replace(/\bpage-flip\b/g, 'obj-page-flip')
    .replace(/\bfade-in\b/g, 'obj-fade-in')
    .replace(/\bopt-item\b/g, 'obj-opt-item')
    .replace(/`twinkle /g, '`obj-twinkle ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done. Lines:', content.split('\n').length);
