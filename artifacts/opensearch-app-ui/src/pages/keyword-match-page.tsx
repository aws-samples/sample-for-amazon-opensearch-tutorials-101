import { useState, useEffect, useContext } from "react";
import { withAuthenticator } from '@aws-amplify/ui-react';
import Link from "@cloudscape-design/components/link";
import * as React from "react";
import Autosuggest from "@cloudscape-design/components/autosuggest";
import Cards from "@cloudscape-design/components/cards";
import Box from "@cloudscape-design/components/box";
import Grid from "@cloudscape-design/components/grid";


import {
  Container,
  ContentLayout,
  Header, Button,
  SpaceBetween,
  ExpandableSection,
  HelpPanel,
  Icon,
  RadioGroup,
  Slider
} from "@cloudscape-design/components";

import { AuthHelper } from "../common/helpers/auth-help";
import { AppPage } from "../common/types";
import config from "../config.json";
import { AppContext } from "../common/context";

function KeywordMatchPage(props: AppPage) {
  const appData = useContext(AppContext);
  const [value, setValue] = React.useState("");
  const [search_field, setSearchField] = React.useState("title");
  const [minimum_should_match, setMinimumShouldMatch] = React.useState(10);
  const [items, setItems] = React.useState([]);

  useEffect(() => {
    const init = async () => {
      let userdata = await AuthHelper.getUserDetails();
      props.setAppData({
        userinfo: userdata
      })
    }
    init();
  }, [])

  async function match(search_value: string, mini_shld_match?: number) {
    if (mini_shld_match && mini_shld_match > 0) {
      setMinimumShouldMatch(mini_shld_match)
    } else {
      mini_shld_match = minimum_should_match
    }
    if (value == "") {
      return
    }
    if (search_value == null) {
      // load all results
      search_value = value
    }
    setValue(search_value);
    
    const token = appData.userinfo.tokens.idToken.toString();
    // call api gateway and pass in the value and set Authorization header
    const response = await fetch(config["apiUrl"] + "/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({
        "attribute_name": search_field,
        "attribute_value": search_value,
        "type": "match",
        "minimum_should_match": String(mini_shld_match) + "%"
      })
    });
    var suggestns = []
    var itms = []
    if (response.ok) {
      // read the response body
      const resp = await response.json();
      const arr = resp['result']['hits']['hits']

      // set the value of the input box to the first result
      // load cards here
      for (let i = 0; i < arr.length; i++) {
        // get the _source
        const source = arr[i]['_source']
        // get the title
        const title = source['title']
        // add to suggestions
        suggestns.push({ value: title })
        itms.push({
          name: title,
          description: source['description'],
          color: source['color'],
          price: "$" + source['price']
        })
      }
      setItems(itms)
    }
  }

  return (
    <ContentLayout
      defaultPadding
      headerVariant="high-contrast"
      header={
        <Header
          variant="h1"
          description="Query your Opensearch datastore"
          actions={<Button iconName="settings" variant="icon" />}>
          Keyword Search
        </Header>
      }
    >
      <Container fitHeight
      >
        <ExpandableSection headerText="Guide to Match Search">
                  <HelpPanel
                    footer={
                      <div>
                        <h3>
                          Learn more{" "}
                          <Icon name="external" size="inherit" />
                        </h3>
                        <ul>
                          <li>
                            <a href="https://opensearch.org/docs/latest/query-dsl/minimum-should-match/">Link to documentation</a>
                          </li>
                        </ul>
                      </div>
                    }
                    
                  >
                    <div>
                      <p>
                      The <b>minimum_should_match</b> parameter in Opensearch is a powerful tool that lets you control how many search terms must match for a document to be included in the results.
                      This is particularly useful when searching across multiple terms and you want to ensure a certain level of relevance. You can specify this either as a number (2) or as a percentage (75%).
                      </p>
                      <p>
                        <b>In our example</b>, let's search for "red running wolves" across product descriptions. Using minimum_should_match, we can specify that at least 2 out of these 3 terms must be present for a result to be returned. Use the slider to adjust how many terms must match.
                        The query would look like:
                      </p>
                      <pre>
                          <code>{
                          JSON.stringify({"query": {
                            "match": {
                              "title": {
                                "query": "red running wolves",
                                "minimum_should_match": "(2 or 75%)"
                              }
                            }
                          }
                        })
                        }</code>
                        </pre>
                      <h4>Best Practices</h4>
                      <ul>
                        <li>Use percentages (e.g., "75%") for queries with varying numbers of terms</li>
                        <li>Start with higher values for more precise results</li>
                        <li>Consider lower values when recall is more important than precision</li>
                      </ul>
                    </div>
                  </HelpPanel>
        </ExpandableSection>
        <div>
          <h3>Select your search field</h3>
        </div>

        <Grid gridDefinition={[{ colspan: 4 }, { colspan: 5 }]}>
        
        <div>
          <RadioGroup onChange={({ detail }) => setSearchField(detail.value)} value={search_field} 
            items={[
              { value: "title", label: "Title"},
              { value: "description", label: "Description" },
              { value: "color", label: "Color" }
              ]}
         />
        </div>
        <div>
        <label><b>Set your <i>minimum-should-match</i> percentage</b></label>
        <Slider onChange={({ detail }) => match(null, detail.value)} step={5} tickMarks value={minimum_should_match} max={100} min={10} />
        </div>
         
          

        </Grid>
        
        <Grid gridDefinition={[{ colspan: 12 }]}>

          <Autosuggest
            onChange={({ detail }) => setValue(detail.value)}
            value={value}
            options={[]}
            onKeyDown={({ detail }) => match(null)}
            ariaLabel="Autosuggest example with suggestions"
            placeholder="A match search on Products e.g. Red Running Shoes"
            empty="No matches found"
          />

          <Cards cardDefinition={{
            header: item => (
              <Link href="#" fontSize="heading-m">
                {item.name}
              </Link>
            ),
            sections: [
              {
                id: "description",
                header: "Description",
                content: item => item.description
              },
              {
                id: "color",
                header: "Color",
                content: item => item.color
              },
              {
                id: "price",
                header: "Price",
                content: item => item.price
              }
            ]
          }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 1 }
            ]}
            items={items}
            loadingText="Loading products"
            visibleSections={["title", "description", "color", "price"]}
            empty={
              <Box
                margin={{ vertical: "xs" }}
                textAlign="center"
                color="inherit"
              >
                <SpaceBetween size="m">
                  <b>No resources</b>
                  
                </SpaceBetween>
              </Box>
            }
          />
        </Grid>
      </Container>
    </ContentLayout>
  );
}

export default withAuthenticator(KeywordMatchPage)