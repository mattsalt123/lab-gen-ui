import { useEffect, useState } from 'react';
import { Spinner } from 'govuk-react';
import { Tabs } from 'govuk-frontend';
import ReactMarkdown from 'react-markdown';
import jiraStyles from '../../styles/Jira.module.scss';
import generatorStyles from '../../styles/Generator.module.scss';
import { useStartConversation, Body, Model } from '@/app/lib/fetchers';
import GherkinValidate from '../gherkinvalidate';
import { Variable } from './generator';
import Mermaid from '@/app/diagrams/mermaid';

interface GeneratorTabsProps {
    reset: () => void;
    variables: Variable[];
    type: string;
    model: Model;
}

/**
 * Generates tabs based on the provided variables and type.
 *
 * @param {boolean} reset - function to reset the tabs
 * @param {Array<Variable>} variables - list of variables to be used in generating tabs
 * @param {string} type - the type of tabs to be generated
 * @param {Model} model - the model object
 * @return {JSX.Element} the generated tabs component
 */
const GeneratorTabs = ({ reset, variables, type, model }: GeneratorTabsProps) => {
    const [resultError, setResultError] = useState('');

    // Create body object with default values
    const body: Body = {
        variables: {},
        provider: model.provider,
        variant: model.variant,
        promptId: type,
    };

    // Populate variables in the body object
    for (let v of variables) {
        body.variables[v.id] = v.value;
    }

    // Call useStartConversation API to get data and error states
    const { data, error, isLoading, isValidating } = useStartConversation(body);

    // useEffect hook to initialize tabs
    useEffect(() => {
        if (typeof window !== 'undefined') {
            let config: any;
            config = typeof config !== 'undefined' ? config : {};
            var $scope = config.scope instanceof HTMLElement ? config.scope : document;
            let $tabs: HTMLElement[] = $scope.querySelectorAll('[data-module="govuk-tabs"]');
            for (let tab of $tabs) {
                new Tabs(tab).init();
            }
        }
    }, []);

    // If there is an error, display error message
    if (error) {
        return (
            <>
                <div className="govuk-error-summary" data-module="govuk-error-summary">
                    <div role="alert">
                        <h2 className="govuk-error-summary__title">There is a problem</h2>
                        <div className="govuk-error-summary__body">
                            <ul className="govuk-list govuk-error-summary__list">
                                <li>
                                    <a href="#">{error.message}</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <button className="govuk-button" onClick={reset}>
                    Reset
                </button>
            </>
        );
    }

    /**
     * Retrieves the tab result based on the provided type.
     *
     * @param {string} type - the type of tab result to retrieve
     * @return {JSX.Element} the tab result based on the provided type
     */
    const handleError = (error: any) => {
        setResultError(error);
    };

    /**
     * Copies the given text to the clipboard if it's not undefined.
     *
     * @param {string | undefined} text - the text to be copied to the clipboard
     * @return {void}
     */
    const copyToClipboard = (text: string | undefined) => {
        if (text) {
            navigator.clipboard.writeText(text);
        }
    };

    /**
     * Retrieves the tab result based on the provided type.
     *
     * @param {string} type - the type of tab result to retrieve
     * @return {ReactNode} the tab result based on the provided type
     */
    const getTabResult = (type: string) => {
        if (data) {
            switch (type) {
                case 'user-story-gherkin':
                    return <GherkinValidate content={data} />;
                case 'diagram':
                    return <Mermaid chart={data.replace('```mermaid', '').replaceAll('`', '')} onError={handleError} />;
                default:
                    return <ReactMarkdown className={jiraStyles.historyResponse}>{data}</ReactMarkdown>;
            }
        }
    };

    // Render tabs component
    return (
        <>
            {resultError && (
                <>
                    <div className="govuk-error-summary" data-module="govuk-error-summary">
                        <div role="alert">
                            <h2 className="govuk-error-summary__title">There is a problem</h2>
                            <div className="govuk-error-summary__body">
                                <ul className="govuk-list govuk-error-summary__list">
                                    <li>
                                        <a href="#">{resultError}</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <button className="govuk-button" onClick={reset}>
                        Reset
                    </button>
                </>
            )}
            <div className="govuk-tabs" data-module="govuk-tabs">
                <h2 className="govuk-tabs__title">Contents</h2>
                <ul className="govuk-tabs__list">
                    <li className="govuk-tabs__list-item govuk-tabs__list-item--selected">
                        <a className="govuk-tabs__tab" href="#result">
                            Result
                        </a>
                    </li>
                    <li className="govuk-tabs__list-item">
                        <a className="govuk-tabs__tab" href="#code">
                            Code
                        </a>
                    </li>
                </ul>
                <div className="govuk-tabs__panel" id="result">
                    <div className="govuk-grid-row">
                        <div className="govuk-grid-column-full">
                            {(isLoading || isValidating) ? (
                                // Render spinner if loading or validating
                                <Spinner
                                    fill="#b1b4b6"
                                    height="56px"
                                    title="Example Spinner implementation"
                                    width="56px"
                                />
                            ) :
                            (data && getTabResult(type))}
                        </div>
                    </div>
                </div>
                <div className="govuk-tabs__panel govuk-tabs__panel--hidden" id="code">
                    <div className="govuk-grid-row">
                        <div className="govuk-grid-column-full">
                            <p className={`govuk-body ${generatorStyles.code}`}>{data}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="govuk-button-group">
                <button className="govuk-button govuk-button--secondary" onClick={reset}>
                    Reset
                </button>
                <button className="govuk-button govuk-button--secondary" onClick={() => copyToClipboard(data)}>
                    Copy
                </button>
            </div>
        </>
    );
};

export default GeneratorTabs;
