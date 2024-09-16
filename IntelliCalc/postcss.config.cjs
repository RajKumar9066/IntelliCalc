const { Variable } = require("lucide-react");

module.exports={
    plugins: {
        'postcss-preset-mantine': {},
        'postcss-simple-vars': {
            Variable:{
                'mantine-breakpoint-xs':'36em',
                'mantine-breakpoint-xs':'48em',
                'mantine-breakpoint-xs':'62em',
                'mantine-breakpoint-xs':'72em',
                'mantine-breakpoint-xs':'88em',
            },
        },
    },
};