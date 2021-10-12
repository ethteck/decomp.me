import { createContext, useState, useContext, useEffect } from "react"

import Select from "../Select"

import styles from "./CompilerOpts.module.css"
import { useCompilersForArch } from "./compilers"
import PresetSelect, { PRESETS } from "./PresetSelect"

interface IOptsContext {
    checkFlag(flag: string): boolean,
    setFlag(flag: string, value: boolean): void,
}

const OptsContext = createContext<IOptsContext>(undefined)

export function Checkbox({ flag, description }) {
    const { checkFlag, setFlag } = useContext(OptsContext)

    const isChecked = checkFlag(flag)

    return <div className={styles.flag} onClick={() => setFlag(flag, !isChecked)}>
        <input type="checkbox" checked={isChecked} onChange={() => setFlag(flag, !isChecked)} />
        <label>{flag}</label>
        <span className={styles.flagDescription}>{description}</span>
    </div>
}

export function FlagSet({ name, children }) {
    const { setFlag } = useContext(OptsContext)

    return <div className={styles.flagSet}>
        <div className={styles.flagSetName}>{name}</div>
        <Select
            onChange={event => {
                for (const child of children) {
                    setFlag(child.props.flag, false)
                }

                setFlag((event.target as HTMLSelectElement).value, true)
            }}
        >
            {children}
        </Select>
    </div>
}

export function FlagOption({ flag, description }: { flag: string, description?: string }) {
    const { checkFlag } = useContext(OptsContext)

    return <option
        value={flag}
        selected={checkFlag(flag)}
    >
        {flag} {description && `(${description})`}
    </option>
}

export type CompilerOptsT = {
    compiler: string,
    cc_opts: string,
}

export type Props = {
    arch?: string,
    value?: CompilerOptsT,
    onChange: (value: CompilerOptsT) => void,
    title?: string,
    isPopup?: boolean,
}

export default function CompilerOpts({ arch, value, onChange, title, isPopup }: Props) {
    const [compiler, setCompiler] = useState((value && value.compiler) || PRESETS[0].compiler)
    let [opts, setOpts] = useState((value && value.cc_opts) || PRESETS[0].opts)

    useEffect(() => {
        onChange({
            compiler,
            cc_opts: opts,
        })
    }, [compiler, opts]) // eslint-disable-line react-hooks/exhaustive-deps

    return <OptsContext.Provider value={{
        checkFlag(flag: string) {
            return opts.split(" ").includes(flag)
        },

        setFlag(flag: string, enable: boolean) {
            let split = opts.split(" ")

            if (enable) {
                split.push(flag)
            } else {
                split = split.filter(f => f !== flag)
            }

            opts = split.join(" ").trim()
            setOpts(opts)
        },
    }}>
        <div className={styles.header} data-is-popup={isPopup}>
            {title || "Compiler Options"}
            <PresetSelect arch={arch} compiler={compiler} setCompiler={setCompiler} opts={opts} setOpts={setOpts} />
        </div>
        <div className={styles.container} data-is-popup={isPopup}>
            <OptsEditor arch={arch} compiler={compiler} setCompiler={setCompiler} opts={opts} setOpts={setOpts} />
        </div>
    </OptsContext.Provider>
}

export function OptsEditor({ arch, compiler, setCompiler, opts, setOpts }: {
    arch?: string,
    compiler: string,
    setCompiler: (compiler: string) => void,
    opts: string,
    setOpts: (opts: string) => void,
}) {
    const compilers = useCompilersForArch(arch)
    const compilerModule = compilers?.find(c => c.id === compiler)

    if (!compilerModule) {
        console.warn("compiler not supported for arch", compiler, arch)
        setCompiler(compilers[0].id)
    }

    return <div>
        <div className={styles.row}>
            <Select
                className={styles.compilerSelect}
                onChange={e => setCompiler((e.target as HTMLSelectElement).value)}
            >
                {Object.values(compilers).map(c => <option
                    key={c.id}
                    value={c.id}
                    selected={c.id === compilerModule?.id}
                >
                    {c.name}
                </option>)}
            </Select>

            <input
                type="text"
                className={styles.textbox}
                value={opts}
                placeholder="no arguments"
                onChange={e => setOpts((e.target as HTMLInputElement).value)}
            />
        </div>

        <div className={styles.flags}>
            {(compiler && compilerModule) ? <compilerModule.Flags /> : <div />}
        </div>
    </div>
}
